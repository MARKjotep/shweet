import type { Base } from "../base";
import { isClassOrId, mergeProperties } from "../../../helpers";
import {
  camel,
  isArray,
  isDefined,
  isNull,
  isObject,
  isString,
  Mapped,
} from "@ohmyqt/u";
import type { CSSinR, CSSValue } from "../../../type";
import { media, Medyas } from "../../../media";
import { support } from "../../../support";

import { _Var } from "../../../var";
import {
  cssStringToObject,
  getAnim,
  prefixAnimationValue,
  supportMedia,
  valToMedia,
} from "./normalize";

/**
 * Split a selector list on top-level commas only. Commas inside strings,
 * comments, escaped text, attribute brackets, and functions (`:is()`,
 * `:not()`, ...) stay part of their selector.
 */
function splitSelectorList(selector: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  let quote: string | null = null;

  for (let i = 0; i < selector.length; i++) {
    const char = selector[i];

    if (char === "\\") {
      i++;
      continue;
    }
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === "/" && selector[i + 1] === "*") {
      const commentEnd = selector.indexOf("*/", i + 2);
      i = commentEnd === -1 ? selector.length : commentEnd + 1;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "(" || char === "[") {
      depth++;
    } else if (char === ")" || char === "]") {
      if (depth > 0) depth--;
    } else if (char === "," && depth === 0) {
      parts.push(selector.slice(start, i));
      start = i + 1;
    }
  }

  parts.push(selector.slice(start));

  return parts;
}

/**
 * Appends one compound suffix (pseudo-class, attribute, class, or id) to every
 * top-level selector in a parent list. Without this, `.a, .b` + `:hover` would
 * produce `.a, .b:hover` and silently drop the `.a:hover` rule.
 */
function appendSelectorSuffix(selector: string, suffix: string): string {
  const parents = splitSelectorList(selector);

  if (parents.length <= 1) return selector + suffix;

  return parents.map((parent) => `${parent.trim()}${suffix}`).join(", ");
}

/**
 * Appends a combinator and nested selector list to every top-level parent
 * selector, producing `.a > .c, .b > .c` rather than a malformed list.
 */
function nestSelectorList(
  selector: string,
  combinator: string,
  targets: string[],
): string {
  const parents = splitSelectorList(selector);

  if (parents.length <= 1) {
    return targets
      .map((target) => `${selector}${combinator}${target.trim()}`)
      .join(", ");
  }

  return parents
    .flatMap((parent) =>
      targets.map(
        (target) => `${parent.trim()}${combinator}${target.trim()}`,
      ),
    )
    .join(", ");
}

/*
  -------------------------
  Clas ID KF process
  -------------------------
  */

export class Proc {
  constructor(private base: Base) {}
  private prefixAnimationValues(selector: string, sel: string, prp: media) {
    // Declaration objects may write animation properties as kebab-case keys
    // (`animation-name`); normalize before deciding how the value is parsed.
    const property = camel(sel);
    const isAnim = property === "animation" || property === "animationName";
    if (!isAnim) return prp;

    // Copy before prefixing so a `media` instance shared between selectors is
    // never mutated (and therefore never double-prefixed).
    const prefixed = Object.assign(new media(), prp);
    Object.entries(prefixed).forEach(([mk, mv]) => {
      prefixed[mk] = this.addPrefixToAnimation(selector, property, mv);
    });
    return prefixed;
  }
  private addPrefixToAnimation(
    sel: string,
    property: string,
    val: CSSValue | CSSValue[],
  ): CSSValue | CSSValue[] {
    if (val instanceof _Var) {
      this.saveAnim(sel, val);
    } else if (isArray(val)) {
      // Prefix every comma-list entry. Without this, only the first array
      // value was rewritten and the remaining animation names were emitted
      // unprefixed.
      return val.map((item) =>
        this.addPrefixToAnimation(sel, property, item as CSSValue),
      );
    } else if (isString(val)) {
      const result = prefixAnimationValue(val, this.base.PREFIX, property);

      result.names.forEach((name) => {
        const pname = `${this.base.PREFIX}${name}`;
        this.base.ANIM.init(pname, new Set()).add(sel);
      });

      return result.value;
    }

    return val;
  }
  private saveAnim(sel: string, val: _Var) {
    getAnim(val).forEach((vv) => {
      this.base.ANIM.init(`${this.base.PREFIX}${vv}`, new Set()).add(sel);
    });
  }
  private processDeclaration(
    name: string,
    k: string,
    v: any,
    declarations: Mapped<string, media | support[]>,
    data: Mapped<string, Mapped<string, media | support[]>>,
  ) {
    if (v instanceof _Var) {
      this.saveAnim(name, v);
      mergeProperties(
        declarations,
        k,
        this.prefixAnimationValues(name, v.var, valToMedia(v)),
      );
      // mergeProperties(props, v.var, this.props(name, v.var, valToMedia(v.value)));
    } else if (k.startsWith(",")) {
      // A leading comma adds a sibling selector to the existing list.
      this.set(name + k, v, data);
    } else if (k.startsWith(":") || k.startsWith("[")) {
      this.set(appendSelectorSuffix(name, k), v, data);
    } else if (k.startsWith(" ")) {
      // The leading whitespace is part of the combinator (`" "`, `" > "`,
      // `" + "`, `" ~ "`). Apply the parent and combinator to every top-level
      // target so a comma list expands to `.parent > .a, .parent > .b`.
      const combinator = k.match(/^\s*(?:[>+~]\s*)?/)?.[0] ?? "";
      this.set(
        nestSelectorList(
          name,
          combinator,
          splitSelectorList(k.slice(combinator.length)),
        ),
        v,
        data,
      );
    } else if (isClassOrId(k)) {
      this.set(appendSelectorSuffix(name, k), v, data);
    } else {
      declarations.set(k, this.prefixAnimationValues(name, k, valToMedia(v)));
    }
  }
  set(
    name: string,
    css: CSSinR,
    data: Mapped<string, Mapped<string, media | support[]>>,
  ) {
    // The legacy object guard also accepted `null`; keep that path so invalid
    // CSS values fail on the same object iteration instead of being skipped.
    if (!isObject(css) && !isNull(css) && !isString(css)) return;
    // -------------------------
    // -------------------------
    const declarations: Mapped<string, media | support[]> = new Mapped();

    if (css instanceof _Var) {
      this.saveAnim(name, css);
      mergeProperties(
        declarations,
        css.var,
        this.prefixAnimationValues(name, css.var, valToMedia(css.value)),
      );
    } else if (css instanceof Medyas) {
      Object.entries(css._value).forEach(([k, v]) => {
        if (isDefined(v)) {
          declarations.set(
            k,
            this.prefixAnimationValues(name, k, valToMedia(v)),
          );
        }
      });
    } else if (css instanceof support) {
      supportMedia(css);
      declarations.init("supports", []).push(css);
    } else if (isArray(css)) {
      css.forEach((cc) => {
        this.set(name, cc, data);
      });
    } else if (isString(css)) {
      const parsed = cssStringToObject(css);
      this.set(name, parsed, data);
    } else {
      Object.entries(css).forEach(([k, v]) => {
        if (v instanceof _Var) {
          this.saveAnim(name, v);
          mergeProperties(
            declarations,
            v.var,
            this.prefixAnimationValues(name, v.var, valToMedia(v.value)),
          );
          return;
        }
        return this.processDeclaration(name, k, v, declarations, data);
      });
    }
    const entry = data.init(name, new Mapped());

    declarations.forEach((value, key) => {
      if (key === "supports" && isArray<support>(value)) {
        data
          .init(name, new Mapped())
          .init(key, [])
          .push(...value);
      } else {
        entry.set(key, value);
      }
    });
  }
}
