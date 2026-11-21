import { isArray, isDefined, log, Mapped, type obj } from "../helpers";
import type { support } from "../support";
import type { media } from "../media";
import type { CSSValue } from "../type";
import type {
  CompileDiagnostic,
  DiagnosticHandler,
  DiagnosticSeverity,
  exmed,
} from "../core/options";
import type { Shweet } from "../core/shweet";
import { Property } from "./property";
import { At, Cid, FontFace, Keyframes } from "./selectors";
import type { Base } from "./selectors/base";
import { toProperty } from "./serialize";

/**
 * One style rule in source (selector assignment) order. `selector` is kept as
 * one intact selector expression; `declarations` is the exact serialized
 * declaration sequence for one media bucket.
 */
export interface StyleRule {
  selector: string;
  declarations: string[];
}

export type StyleRulesByMedia = Record<string, StyleRule[]>;

/** Supports rules keyed by supports condition, then by media name. */
export type SupportsStyleRulesByMedia = Record<string, StyleRulesByMedia>;

/**
 * Compatibility aliases for the previous declaration-inverted collection
 * shape. The compiler no longer inverts declarations before grouping, but deep
 * type imports keep resolving.
 */
export type SelectorsByDeclaration = Record<string, string[]>;
export type SelectorsByDeclarationByMedia = Record<
  string,
  SelectorsByDeclaration
>;
export type SupportsByMedia = Record<string, SelectorsByDeclarationByMedia>;

/** Keyframe rule text grouped by media and keyframe at-rule. */
export type KeyframeBlocksByMedia = Record<string, Record<string, string[]>>;

export interface CollectOptions {
  shaker: string[];
  include: string[];
  exportMap?: boolean | undefined;
  cid: Mapped<string, Set<string>>;
  /** Root source path, used only when a handler has no path of its own. */
  sourcePath?: string | undefined;
  /** Optional structured diagnostic sink. */
  onDiagnostic?: DiagnosticHandler | undefined;
}

export interface CollectedCss {
  /** Ordered style rules per media bucket, before conservative grouping. */
  styleRulesByMedia: StyleRulesByMedia;
  /** Ordered supports rules per condition and media bucket. */
  supportsRulesByCondition: SupportsStyleRulesByMedia;
  keyframeBlocksByMedia: KeyframeBlocksByMedia;
  atRules: Set<string>;
}

/**
 * The subset of `CollectOptions` needed while walking selector handlers. It is
 * derived from the options type so the two cannot drift apart.
 */
type CollectContext = Pick<
  CollectOptions,
  "shaker" | "include" | "exportMap" | "cid" | "sourcePath" | "onDiagnostic"
>;

/* -------------------------------------------------------------------------
 * Diagnostics and traversal guards
 * ---------------------------------------------------------------------- */

interface DiagnosticInput {
  code: string;
  severity: DiagnosticSeverity;
  message: string;
  rule?: string;
  selector?: string;
}

/**
 * Dispatches one structured diagnostic.
 *
 * When a callback is supplied it owns reporting, so the historical console
 * logging is skipped to avoid double-reporting. Without a callback the
 * `fallback` preserves the previous logging behavior exactly. A malformed
 * consumer callback (non-function value or a thrown error) is ignored: CSS
 * collection must remain deterministic and must never abort because of a
 * diagnostic sink.
 */
const reportDiagnostic = (
  context: CollectContext,
  handler: Base,
  input: DiagnosticInput,
  fallback?: () => void,
) => {
  const diagnostic: CompileDiagnostic = {
    code: input.code,
    severity: input.severity,
    message: input.message,
    sourcePath: handler.SOURCE || context.sourcePath || "",
  };
  if (input.rule !== undefined) diagnostic.rule = input.rule;
  if (input.selector !== undefined) diagnostic.selector = input.selector;

  const onDiagnostic = context.onDiagnostic;

  if (typeof onDiagnostic === "function") {
    try {
      onDiagnostic(diagnostic);
    } catch {
      // A consumer callback must never destabilize CSS collection.
    }
    return;
  }

  fallback?.();
};

/**
 * Per-collection traversal bookkeeping.
 *
 * `visited` deduplicates handlers that were already fully processed (the same
 * object imported twice, or reached through two nested paths). `active` is the
 * current recursion stack; only a handler found in `active` is a real cycle.
 * `stack` exists to report the source-path chain, not to affect output order.
 */
interface TraversalState {
  visited: Set<Base>;
  active: Set<Base>;
  stack: Base[];
}

const createTraversalState = (): TraversalState => ({
  visited: new Set(),
  active: new Set(),
  stack: [],
});

/**
 * Cycle reports are deduplicated per repeated handler and source-path chain, so
 * the animation pre-pass and the style-rule pass do not double-report the same
 * back edge while genuinely distinct cycles (for example a self link and a
 * longer round trip) are still reported.
 */
type ReportedCycles = Map<Base, Set<string>>;

/**
 * Returns true when the caller should descend into `handler`. Duplicates are
 * silently skipped; cycles are reported at most once per handler and path
 * chain and then skipped, which keeps traversal terminating and deterministic.
 */
const enterHandler = (
  context: CollectContext,
  handler: Base,
  state: TraversalState,
  reportedCycles: ReportedCycles,
): boolean => {
  if (state.active.has(handler)) {
    const cycle = [...state.stack, handler].map(
      (node) => node.SOURCE || context.sourcePath || "",
    );
    const chain = cycle.join(" -> ");

    let reportedChains = reportedCycles.get(handler);
    if (reportedChains === undefined) {
      reportedChains = new Set();
      reportedCycles.set(handler, reportedChains);
    }

    if (!reportedChains.has(chain)) {
      reportedChains.add(chain);

      reportDiagnostic(context, handler, {
        code: "import.cycle",
        severity: "warning",
        message: `Circular import detected: ${chain}`,
      });
    }

    return false;
  }

  if (state.visited.has(handler)) return false;

  state.visited.add(handler);
  state.active.add(handler);
  state.stack.push(handler);

  return true;
};

const leaveHandler = (handler: Base, state: TraversalState) => {
  state.stack.pop();
  state.active.delete(handler);
};

/* -------------------------------------------------------------------------
 * Selector matching
 * ---------------------------------------------------------------------- */

const xmatch = (cssContent: string, regex: RegExp): string[] => {
  return Array.from(
    cssContent.matchAll(regex),
    (match) => match[1],
  ).filter((match): match is string => match !== undefined);
};

const getCID = (
  context: CollectContext,
  cssStr: string,
  prefix: string,
  exportMap?: boolean,
  exportX: boolean = true,
) => {
  const classRegex = /\.(?![0-9])([a-zA-Z0-9_-]+)(?![^{]*})/g; // Matches .className
  const idRegex = /#(?![0-9])([a-zA-Z0-9_-]+)(?![^{]*})/g; // Matches #idName
  const tagRegex = /\b([a-zA-Z][a-zA-Z0-9]*)\b(?![^{}]*})/g; // Matches HTML tags like div, span, etc.
  //

  const combined = [
    ...new Set(xmatch(cssStr, classRegex)),
    ...new Set(xmatch(cssStr, idRegex)),
  ];
  if (exportX && isDefined(exportMap) && exportMap) {
    combined.forEach((className) => {
      context.cid.init(className.replaceAll("-", "_"), new Set()).add(
        prefix + className,
      );
    });
  }
  combined.push(...new Set(xmatch(cssStr, tagRegex)));

  return combined.some(
    (selectorName) =>
      context.shaker.includes(selectorName) ||
      context.include.includes(selectorName),
  );
};

/**
 * A selector class/id marker only starts a real token when it is followed by
 * an identifier. Digits are deliberately excluded: a dot before a number is
 * a decimal separator (`:nth-child(2.5)`), not a class selector.
 */
const isSelectorIdentifierStart = (sel: string, index: number): boolean => {
  const next = sel[index];
  if (next === undefined) return false;
  if (next === "\\") return true;
  if (/[a-zA-Z_-]/.test(next)) return true;

  return next.charCodeAt(0) >= 0x80;
};

/**
 * Prefixes class/id selector tokens without treating punctuation inside
 * quoted strings, comments, escapes, or attribute selectors as tokens.
 *
 * This is a bounded token scanner rather than a CSS parser: anything it does
 * not recognize is copied through unchanged.
 */
const applyPrefix = (sel: string, prefix?: string) => {
  if (!prefix) return sel;

  let result = "";
  let index = 0;
  let quote: string | undefined;
  let attributeDepth = 0;

  while (index < sel.length) {
    const character = sel[index]!;

    // Escapes make the next character part of the current identifier, so a
    // `\.` or `\#` must never be considered a selector marker.
    if (character === "\\") {
      result += character;
      if (index + 1 < sel.length) result += sel[index + 1];
      index += 2;
      continue;
    }

    if (quote !== undefined) {
      result += character;
      if (character === quote) quote = undefined;
      index += 1;
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      result += character;
      index += 1;
      continue;
    }

    if (character === "/" && sel[index + 1] === "*") {
      const commentEnd = sel.indexOf("*/", index + 2);
      const end = commentEnd === -1 ? sel.length : commentEnd + 2;
      result += sel.slice(index, end);
      index = end;
      continue;
    }

    if (character === "[") attributeDepth += 1;
    if (character === "]") attributeDepth = Math.max(0, attributeDepth - 1);

    if (
      attributeDepth === 0 &&
      (character === "." || character === "#") &&
      isSelectorIdentifierStart(sel, index + 1)
    ) {
      // Prefix the token itself, not the surrounding punctuation. The rest of
      // the identifier is copied by the normal scanner path.
      result += character + prefix;
      index += 1;
      continue;
    }

    result += character;
    index += 1;
  }

  return result;
};

/* -------------------------------------------------------------------------
 * Declaration collection
 * ---------------------------------------------------------------------- */

const isIncluded = (
  context: CollectContext,
  prefixedName: string,
  hasClass: boolean,
) => {
  // A shaker only filters class/id selectors; tag and attribute selectors stay
  // unless the caller explicitly filtered them through `hasClass`.
  const filteredByShaker =
    context.shaker.length > 0 &&
    (prefixedName.startsWith(".") || prefixedName.startsWith("#"));

  return !filteredByShaker || hasClass;
};

const addStyleRule = (
  rules: StyleRulesByMedia,
  mediaName: string,
  rule: StyleRule,
) => {
  (rules[mediaName] ??= []).push(rule);
};

/* -------------------------------------------------------------------------
 * Style rules
 * ---------------------------------------------------------------------- */

const collectStyleRules = (
  cid: Cid,
  context: CollectContext,
  styleRulesByMedia: StyleRulesByMedia,
  supportsRulesByCondition: SupportsStyleRulesByMedia,
  state: TraversalState,
  reportedCycles: ReportedCycles,
) => {
  // Duplicate imports are silent; only a handler on the active stack is a
  // cycle. Both cases terminate while keeping first-seen traversal order.
  if (!enterHandler(context, cid, state, reportedCycles)) return;

  cid.DATA.forEach((declarations, selector) => {
    const prefixedName = applyPrefix(selector, cid.PREFIX);
    // Export-map entries always follow the active compilation request, not the
    // imported instance's creation-time EXPORT flag.
    const hasClass = getCID(context, selector, cid.PREFIX, context.exportMap);

    if (!isIncluded(context, prefixedName, hasClass)) return;

    // Declaration provenance starts here, while the ordered selector map still
    // exists. `Mapped` preserves the first-seen property/media order.
    const styleDeclarations = new Mapped<string, string[]>();
    const supportDeclarations = new Mapped<
      string,
      Mapped<string, string[]>
    >();

    declarations.forEach((conditional, property) => {
      if (property === "supports") {
        if (isArray<support>(conditional)) {
          conditional.forEach((supportRule: support) => {
            supportRule.value.forEach((values, supportsCondition) => {
              const declarationsByMedia = supportDeclarations.init(
                supportsCondition,
                new Mapped<string, string[]>(),
              );

              values.forEach((value) => {
                Object.entries(value).forEach(
                  ([declaredProperty, declaredMedia]) => {
                    Object.entries(declaredMedia as media).forEach(
                      ([mediaName, mediaValue]) => {
                        declarationsByMedia
                          .init(mediaName, [])
                          .push(
                            Property(
                              declaredProperty,
                              mediaValue,
                              cid.UNIT,
                            ),
                          );
                      },
                    );
                  },
                );
              });
            });
          });
        }
      } else {
        Object.entries(conditional as media).forEach(([mediaName, value]) => {
          styleDeclarations
            .init(mediaName, [])
            .push(Property(property, value, cid.UNIT));
        });
      }
    });

    styleDeclarations.forEach((declarationsForMedia, mediaName) => {
      addStyleRule(styleRulesByMedia, mediaName, {
        selector: prefixedName,
        declarations: declarationsForMedia,
      });
    });

    supportDeclarations.forEach(
      (declarationsByMedia, supportsCondition) => {
        const rulesByMedia = (supportsRulesByCondition[supportsCondition] ??=
          {});

        declarationsByMedia.forEach((declarationsForMedia, mediaName) => {
          addStyleRule(rulesByMedia, mediaName, {
            selector: prefixedName,
            declarations: declarationsForMedia,
          });
        });
      },
    );
  });

  cid.IMPORTED.forEach((imported) => {
    if (imported instanceof Cid) {
      collectStyleRules(
        imported,
        context,
        styleRulesByMedia,
        supportsRulesByCondition,
        state,
        reportedCycles,
      );
    }
  });

  leaveHandler(cid, state);
};

const collectAnimationReferences = (
  animationReferences: Mapped<string, Set<string>>,
  source: Mapped<string, Set<string>>,
) => {
  source.forEach((selectors, animationName) => {
    selectors.forEach((selector) => {
      animationReferences.init(animationName, new Set()).add(selector);
    });
  });
};

/**
 * Walks the complete imported Cid tree so animation references declared by any
 * nested import are known before keyframes are filtered by the shaker.
 */
const collectCidAnimationReferences = (
  cid: Cid,
  context: CollectContext,
  animationReferences: Mapped<string, Set<string>>,
  state: TraversalState,
  reportedCycles: ReportedCycles,
) => {
  if (!enterHandler(context, cid, state, reportedCycles)) return;

  collectAnimationReferences(animationReferences, cid.ANIM);

  cid.IMPORTED.forEach((imported) => {
    if (imported instanceof Cid) {
      collectCidAnimationReferences(
        imported,
        context,
        animationReferences,
        state,
        reportedCycles,
      );
    }
  });

  leaveHandler(cid, state);
};

/* -------------------------------------------------------------------------
 * Keyframes
 * ---------------------------------------------------------------------- */

const collectKeyframes = (
  keyframes: Keyframes,
  context: CollectContext,
  keyframeBlocksByMedia: KeyframeBlocksByMedia,
  animationReferences: Mapped<string, Set<string>>,
  state: TraversalState,
  reportedCycles: ReportedCycles,
) => {
  if (!enterHandler(context, keyframes, state, reportedCycles)) return;

  const pushKeyframeBlock = (
    mediaName: string,
    keyframeRule: string,
    block: string,
  ) => {
    const rulesForMedia = (keyframeBlocksByMedia[mediaName] ??= {});
    (rulesForMedia[keyframeRule] ??= []).push(block);
  };

  const isStepReferenced = (animationName: string) => {
    if (!context.shaker.length) return true;

    const referencedSelectors = animationReferences.get(animationName);

    return (
      referencedSelectors !== undefined &&
      [...referencedSelectors].some((selector) =>
        getCID(context, selector, "", false, false),
      )
    );
  };

  keyframes.DATA.forEach((data, keyframeRule) => {
    const animationName = keyframeRule.split(" ")[1]!;
    const includeStep = isStepReferenced(animationName);

    data.forEach((css, stepSelector) => {
      // At runtime each keyframe step value is the property map created by
      // `Proc`; `CMapper`'s shallow value type does not express that nesting.
      if (!(css instanceof Mapped)) return;

      const blocksByMedia: obj<string[]> = {};
      css.forEach((mediaMap, property) => {
        if (property === "supports" || isArray(mediaMap)) {
          reportDiagnostic(
            context,
            keyframes,
            {
              code: "keyframes.supports-unsupported",
              severity: "error",
              message: "@supports is not supported in @keyframes",
              rule: keyframeRule,
              selector: stepSelector,
            },
            () => {
              log.e = [
                "@supports not supported in @keyframes",
                { error: "support in keyframes" },
              ];
            },
          );
          return;
        }
        if (!includeStep) return;

        Object.entries<CSSValue>(mediaMap).forEach(([mediaName, value]) => {
          (blocksByMedia[mediaName] ??= []).push(
            Property(property, value, keyframes.UNIT),
          );
        });
      });

      Object.entries(blocksByMedia).forEach(([mediaName, blocks]) => {
        pushKeyframeBlock(
          mediaName,
          keyframeRule,
          toProperty(stepSelector, blocks),
        );
      });
    });
  });

  keyframes.IMPORTED.forEach((imported) => {
    if (imported instanceof Keyframes) {
      collectKeyframes(
        imported,
        context,
        keyframeBlocksByMedia,
        animationReferences,
        state,
        reportedCycles,
      );
    }
  });

  leaveHandler(keyframes, state);
};

/* -------------------------------------------------------------------------
 * At-rules and font faces
 * ---------------------------------------------------------------------- */

const collectAtRules = (
  at: At,
  atRules: Set<string>,
  context: CollectContext,
  state: TraversalState,
  reportedCycles: ReportedCycles,
) => {
  if (!enterHandler(context, at, state, reportedCycles)) return;

  for (const [key, values] of at.ARR) {
    values.forEach((value) => {
      const formattedValue = value.includes("(") ? value : `"${value}"`;
      atRules.add(`${key} ${formattedValue.trim()};`);
    });
  }
  at.IMPORTED.forEach((imported) => {
    if (imported instanceof At) {
      collectAtRules(imported, atRules, context, state, reportedCycles);
    }
  });

  leaveHandler(at, state);
};

const FONT_FACE = "@font-face";

const collectFontFaces = (
  fontFace: FontFace,
  atRules: Set<string>,
  context: CollectContext,
  state: TraversalState,
  reportedCycles: ReportedCycles,
) => {
  if (!enterHandler(context, fontFace, state, reportedCycles)) return;

  const fontRules = fontFace.ARR.get(FONT_FACE) ?? new Set();
  fontRules.forEach((rule) => {
    atRules.add(`${FONT_FACE} {\n\t${rule}\n}`);
  });

  fontFace.IMPORTED.forEach((imported) => {
    if (imported instanceof FontFace) {
      collectFontFaces(imported, atRules, context, state, reportedCycles);
    }
  });

  leaveHandler(fontFace, state);
};

/* -------------------------------------------------------------------------
 * Compilation entry
 * ---------------------------------------------------------------------- */

export const collectCss = <T extends exmed>(
  shweet: Shweet<T>,
  options: CollectOptions,
): CollectedCss => {
  const styleRulesByMedia: StyleRulesByMedia = {};
  const supportsRulesByCondition: SupportsStyleRulesByMedia = {};
  const keyframeBlocksByMedia: KeyframeBlocksByMedia = {};
  const animationReferences = new Mapped<string, Set<string>>();
  const atRules = new Set<string>();
  const context: CollectContext = options;

  // One traversal state per handler kind keeps each handler subtree visited
  // once. Direct duplicates are already removed at load time; these guards also
  // cover duplicates reached through different nested import paths, and make
  // cycles terminate deterministically if internal handler links are mutated.
  const cidAnimationState = createTraversalState();
  const cidRulesState = createTraversalState();
  const keyframesState = createTraversalState();
  const atState = createTraversalState();
  const fontFaceState = createTraversalState();

  // The animation pre-pass and the style-rule pass walk the same Cid tree, so a
  // shared set keeps a cycle from being reported twice for the same handler.
  const reportedCycles: ReportedCycles = new Map();

  const values = Object.values(shweet);

  // Animation references are gathered first from every Cid in the import tree,
  // so shaker filtering sees imported selectors no matter where the keyframes
  // handler appears in the traversal order.
  for (const value of values) {
    if (value instanceof Cid) {
      collectCidAnimationReferences(
        value,
        context,
        animationReferences,
        cidAnimationState,
        reportedCycles,
      );
    }
  }

  for (const value of values) {
    if (value instanceof Cid) {
      collectStyleRules(
        value,
        context,
        styleRulesByMedia,
        supportsRulesByCondition,
        cidRulesState,
        reportedCycles,
      );
    } else if (value instanceof Keyframes) {
      collectKeyframes(
        value,
        context,
        keyframeBlocksByMedia,
        animationReferences,
        keyframesState,
        reportedCycles,
      );
    } else if (value instanceof At) {
      collectAtRules(value, atRules, context, atState, reportedCycles);
    } else if (value instanceof FontFace) {
      collectFontFaces(value, atRules, context, fontFaceState, reportedCycles);
    }
  }

  return {
    styleRulesByMedia,
    supportsRulesByCondition,
    keyframeBlocksByMedia,
    atRules,
  };
};
