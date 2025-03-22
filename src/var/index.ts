import { obj, oItems, oLen, reCamel } from "../@";
import { Value } from "../css/value";
import { med, media } from "../media";
import { CSSValue } from "../type";

export class _Var {
  k: string = "";
  fallback?: CSSValue;
  var: string = "";
  value: media;
  constructor(vr: obj<CSSValue | media> = {}, fallback?: CSSValue) {
    if (oLen(vr)) {
      const [k, v] = oItems(vr)[0];
      this.k = k;
      this.var = "--" + reCamel(k);
      this.value = v instanceof media ? v : med(v, {});
      this.fallback = fallback;
    } else {
      this.value = med({});
    }
  }
  __(fallback?: CSSValue): string {
    if (fallback) {
      this.fallback = fallback;
    }
    const fb = this.fallback;
    if (fb) {
      return `var(${this.var}, ${Value(fb)})`;
      return "";
    } else {
      return `var(${this.var})`;
    }
  }
  new(val: CSSValue, fallback?: CSSValue) {
    return new _Var(
      {
        [this.k]: val instanceof media ? val : Value(val),
      },
      fallback,
    );
  }
}

export const Var = (vr: obj<CSSValue | media>, fallback?: CSSValue) => {
  return new _Var(vr, fallback);
};
