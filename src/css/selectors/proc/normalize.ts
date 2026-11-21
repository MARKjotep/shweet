import type { obj } from "../../../helpers";
import { camel, isArray, isDefined, isFunction } from "@ohmyqt/u";
import type { CSSValue } from "../../../type";
import { med, media } from "../../../media";
import type { support } from "../../../support";
import { _Var } from "../../../var";

export const valToMedia = (val: CSSValue | media): media => {
  if (isFunction(val)) {
    return valToMedia(val());
  }
  if (val instanceof media) return val;
  if (val instanceof _Var) return med(val.__(), {});
  return med(val, {});
};

const isQuoteChar = (char: string) => char === '"' || char === "'";

const openChars = "([{";
const closeChars = ")]}";

/**
 * Splits on a single separator that appears at the top level: outside quoted
 * strings, outside parenthesis/bracket/brace nesting, and not escaped by a
 * backslash. This is not a complete CSS tokenizer, but it keeps separators
 * inside `url(data:...;...)`, quoted strings, and function arguments intact.
 */
const splitTopLevel = (input: string, separator: string): string[] => {
  const parts: string[] = [];
  let start = 0;
  let quote: string | null = null;
  let depth = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i]!;

    if (quote) {
      if (char === "\\") {
        i++;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "\\") {
      i++;
    } else if (isQuoteChar(char)) {
      quote = char;
    } else if (openChars.includes(char)) {
      depth++;
    } else if (closeChars.includes(char)) {
      if (depth > 0) depth--;
    } else if (char === separator && depth === 0) {
      parts.push(input.slice(start, i));
      start = i + 1;
    }
  }

  parts.push(input.slice(start));
  return parts;
};

/** Index of the first top-level occurrence of `target`, or `-1`. */
const findTopLevel = (input: string, target: string): number => {
  let quote: string | null = null;
  let depth = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i]!;

    if (quote) {
      if (char === "\\") {
        i++;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "\\") {
      i++;
    } else if (isQuoteChar(char)) {
      quote = char;
    } else if (openChars.includes(char)) {
      depth++;
    } else if (closeChars.includes(char)) {
      if (depth > 0) depth--;
    } else if (char === target && depth === 0) {
      return i;
    }
  }

  return -1;
};

const numericLiteral =
  /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

/**
 * Converts only complete decimal numeric literals. Hex forms, `Infinity`,
 * `NaN`, and values with extra tokens stay strings so they are never rewritten
 * as unrelated CSS numbers.
 */
const toFiniteNumber = (value: string): number | undefined => {
  if (!numericLiteral.test(value)) return undefined;

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

/**
 * Parses the legacy `"property: value; ..."` string form.
 *
 * Declarations are separated by top-level semicolons and split at the first
 * top-level colon. Quoted separators, escapes, nested functions, and data URLs
 * are preserved. Custom properties keep their original name and token content;
 * their numeric-looking values are not converted.
 */
export function cssStringToObject(css: string) {
  const properties: any = {};

  splitTopLevel(css, ";").forEach((fragment) => {
    const declaration = fragment.trim();
    if (declaration === "") return;

    const colon = findTopLevel(declaration, ":");
    // A fragment without a top-level colon is malformed; preserve the valid
    // declarations around it instead of emitting a corrupt property.
    if (colon === -1) return;

    const rawKey = declaration.slice(0, colon).trim();
    if (rawKey === "") return;

    const value = declaration.slice(colon + 1).trim();
    const isCustomProperty = rawKey.startsWith("--");
    const key = isCustomProperty ? rawKey : camel(rawKey);

    if (isCustomProperty) {
      properties[key] = value;
      return;
    }

    const numeric = toFiniteNumber(value);
    properties[key] = numeric === undefined ? value : numeric;
  });

  return properties;
}

/*
  -------------------------
  Animation name prefixing
  -------------------------
*/

const cssWideKeywords = new Set([
  "initial",
  "inherit",
  "unset",
  "revert",
  "revert-layer",
]);

const timingFunctionKeywords = new Set([
  "linear",
  "ease",
  "ease-in",
  "ease-out",
  "ease-in-out",
  "step-start",
  "step-end",
]);

const timingFunctionNames = new Set(["cubic-bezier", "steps", "linear"]);

const directionKeywords = new Set([
  "normal",
  "reverse",
  "alternate",
  "alternate-reverse",
]);

const fillKeywords = new Set(["forwards", "backwards", "both"]);

const playStateKeywords = new Set(["running", "paused"]);

const shorthandIdentification =
  /^-{0,2}[A-Za-z_][A-Za-z0-9_-]*$/;

const timeValue =
  /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?(?:s|ms)$/i;

const quotedToken = (token: string) =>
  token.length >= 2 &&
  isQuoteChar(token[0]!) &&
  token[token.length - 1] === token[0];

/** Splits a value on top-level whitespace while keeping quoted/function tokens whole. */
const splitTopLevelWhitespace = (input: string): string[] => {
  const tokens: string[] = [];
  let start = -1;
  let quote: string | null = null;
  let depth = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i]!;

    if (quote) {
      if (char === "\\") i++;
      else if (char === quote) quote = null;
      continue;
    }

    if (char === "\\") {
      if (start === -1) start = i;
      i++;
      continue;
    }

    if (isQuoteChar(char)) {
      if (start === -1) start = i;
      quote = char;
      continue;
    }

    if (openChars.includes(char)) {
      if (start === -1) start = i;
      depth++;
      continue;
    }

    if (closeChars.includes(char)) {
      if (start === -1) start = i;
      if (depth > 0) depth--;
      continue;
    }

    if (depth === 0 && /\s/.test(char)) {
      if (start !== -1) {
        tokens.push(input.slice(start, i));
        start = -1;
      }
      continue;
    }

    if (start === -1) start = i;
  }

  if (start !== -1) tokens.push(input.slice(start));
  return tokens;
};

type TokenKind = "skip" | "name" | "abort";

const classifyShorthandToken = (token: string): TokenKind => {
  if (quotedToken(token)) return "name";

  const fn = token.match(/^([A-Za-z][A-Za-z0-9-]*)\(/);
  if (fn) {
    if (token.endsWith(")") && timingFunctionNames.has(fn[1]!.toLowerCase())) {
      return "skip";
    }
    // `var()`, `env()`, or any unknown function may hide a name or other
    // component; leave the whole item untouched instead of guessing.
    return "abort";
  }

  if (timeValue.test(token) || numericLiteral.test(token)) return "skip";
  // Importance is handled by the caller, which also checks its position.
  if (token.toLowerCase() === "!important") return "skip";

  if (!shorthandIdentification.test(token)) return "abort";

  const lower = token.toLowerCase();
  if (
    cssWideKeywords.has(lower) ||
    timingFunctionKeywords.has(lower) ||
    directionKeywords.has(lower) ||
    fillKeywords.has(lower) ||
    playStateKeywords.has(lower) ||
    lower === "infinite" ||
    lower === "none"
  ) {
    return "skip";
  }

  return "name";
};

const prefixedNameToken = (
  token: string,
  prefix: string,
): { text: string; name: string } | undefined => {
  if (quotedToken(token)) {
    const inner = token.slice(1, -1);
    if (inner === "") return undefined;
    const quote = token[0]!;
    return { text: `${quote}${prefix}${inner}${quote}`, name: inner };
  }

  return { text: `${prefix}${token}`, name: token };
};

interface AnimationValueResult {
  value: string;
  names: string[];
}

const prefixShorthandItem = (
  item: string,
  prefix: string,
): AnimationValueResult => {
  const tokens = splitTopLevelWhitespace(item);
  let nameIndex = -1;
  let nameToken = "";

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    const lower = token.toLowerCase();
    const kind = classifyShorthandToken(token);

    if (kind === "abort") return { value: item, names: [] };
    // Importance is not part of the animation value; only accept it trailing.
    if (lower === "!important" && i !== tokens.length - 1) {
      return { value: item, names: [] };
    }
    if (kind === "skip") continue;
    if (nameIndex !== -1) return { value: item, names: [] };

    nameIndex = i;
    nameToken = token;
  }

  if (nameIndex === -1) return { value: item, names: [] };

  const prefixed = prefixedNameToken(nameToken, prefix);
  if (!prefixed) return { value: item, names: [] };

  const next = [...tokens];
  next[nameIndex] = prefixed.text;
  return { value: next.join(" "), names: [prefixed.name] };
};

const prefixNameItem = (
  item: string,
  prefix: string,
): AnimationValueResult => {
  const tokens = splitTopLevelWhitespace(item.trim());
  const trailing =
    tokens.length > 1 && tokens[tokens.length - 1]!.toLowerCase() === "!important"
      ? tokens.pop()!
      : undefined;

  if (tokens.length !== 1) return { value: item, names: [] };

  const token = tokens[0]!;
  if (quotedToken(token)) {
    const prefixed = prefixedNameToken(token, prefix);
    if (!prefixed) return { value: item, names: [] };
    return {
      value: [prefixed.text, trailing].filter(Boolean).join(" "),
      names: [prefixed.name],
    };
  }

  if (token.includes("(")) return { value: item, names: [] };
  if (timeValue.test(token) || numericLiteral.test(token)) {
    return { value: item, names: [] };
  }
  if (!shorthandIdentification.test(token)) return { value: item, names: [] };

  const lower = token.toLowerCase();
  if (cssWideKeywords.has(lower) || lower === "none") {
    return { value: item, names: [] };
  }

  return {
    value: [prefixedNameToken(token, prefix)!.text, trailing]
      .filter(Boolean)
      .join(" "),
    names: [token],
  };
};

const prefixAnimationList = (
  value: string,
  prefix: string,
  prefixItem: (item: string, prefix: string) => AnimationValueResult,
): AnimationValueResult => {
  const items = splitTopLevel(value, ",");

  // A leading/trailing/double comma is malformed; keep the source untouched.
  if (items.some((item) => item.trim() === "")) {
    return { value, names: [] };
  }

  const names: string[] = [];
  let changed = false;

  const rendered = items.map((item) => {
    const result = prefixItem(item, prefix);
    names.push(...result.names);
    if (result.value !== item) changed = true;
    return result.value;
  });

  return {
    value: changed ? rendered.map((item) => item.trim()).join(", ") : value,
    names,
  };
};

/**
 * Prefixes animation names in a comma-separated `animation` shorthand or
 * `animationName` list. Timing, easing, iteration, direction, fill, and
 * play-state tokens are left alone. Ambiguous values (unknown functions,
 * escaped identifiers, extra name candidates) are returned unchanged.
 */
export const prefixAnimationValue = (
  value: string,
  prefix: string,
  property: string = "animation",
): AnimationValueResult => {
  if (property === "animationName") {
    return prefixAnimationList(value, prefix, prefixNameItem);
  }

  return prefixAnimationList(value, prefix, prefixShorthandItem);
};

/**
 * Normalizes every value attached to a `supports()` declaration in place.
 */
export const supportMedia = (css: support) => {
  css.value.forEach((v, sel) => {
    css.value.set(
      sel,
      v.map((vx) => {
        const mm: obj<media> = {};
        Object.entries(vx).forEach(([k, v2]) => {
          if (isDefined(v2)) {
            mm[k] = valToMedia(v2);
          }
        });
        return mm;
      }),
    );
  });
};

/**
 * Extracts the animation name(s) from a value. The second parameter is kept
 * for source compatibility with the legacy helper, but results are always
 * returned in a fresh array.
 */
export const getAnim = (
  val: CSSValue | CSSValue[],
  _accumulator: string[] = [],
): string[] => {
  if (isArray(val)) {
    return getAnim(val[0]);
  }
  if (val instanceof _Var) {
    return getAnim(Object.values(val.value));
  }

  return [String(val)];
};
