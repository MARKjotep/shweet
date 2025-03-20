import { Base, CMapper } from "..";
import {
  $$,
  isArr,
  isClassOrId,
  isDefined,
  isFN,
  isObj,
  isStr,
  log,
  Mapper,
  obj,
  oItems,
  oVals,
} from "../../../@";
import { med, media, Medyas } from "../../../media";
import { support } from "../../../support";
import { CSSinR, CSSValue } from "../../../types";
import { _Var } from "../../../var";

const valToMedia = (val: CSSValue | media): media => {
  if (isFN(val)) {
    return valToMedia(val());
  }
  if (val instanceof media) return val;
  if (val instanceof _Var) return med(val.__(), {});
  return med(val, {});
};

/*
  -------------------------
  Clas ID KF process
  -------------------------
  */

const supportMedia = (css: support) => {
  css.value.forEach((v, sel) => {
    css.value.set(
      sel,
      v.map((vx) => {
        const mm: obj<media> = {};
        oItems(vx).forEach(([k, v2]) => {
          if (isDefined(v2)) {
            mm[k] = valToMedia(v2);
          }
        });
        return mm;
      }),
    );
  });
};
const getAnim = (val: CSSValue | CSSValue[], an: string[] = []) => {
  const _an: string[] = [];
  //
  if (isArr(val)) {
    return getAnim(val[0], _an);
  }
  if (val instanceof _Var) {
    return getAnim(oVals(val.value), _an);
  }

  _an.push(String(val));

  return _an;
};

export class Proc {
  constructor(private base: Base) {}
  private props(selector: string, sel: string, prp: media) {
    const isAnim = ["animation", "animationName"].includes(sel);
    oItems(prp).forEach(([mk, mv]) => {
      if (isAnim) {
        prp[mk] = this.addPrefixToAnimation(selector, mv);
      } else {
        prp[mk] = mv;
      }
      //
    });
    return prp;
  }
  private addPrefixToAnimation(sel: string, val: CSSValue | CSSValue[]) {
    if (val instanceof _Var) {
      this.saveAnim(sel, val);
    } else if (isArr(val)) {
      val[0] = this.addPrefixToAnimation(sel, val[0]);
      return val;
    } else if (isStr(val) && !val.includes("(")) {
      const animations = val.split(", ");
      const modifiedAnimations = animations.map((animation) => {
        const parts = animation.split(" ");
        const name = parts[0];
        const rest = parts.slice(1).join(" "); // Rejoin the duration and easing
        const pname = `${this.base.PREFIX}${name}`;
        this.base.ANIM.init(pname, new Set()).add(sel);
        return `${this.base.PREFIX}${name} ${rest}`.trim();
      });
      return modifiedAnimations.join(", ");
    }

    return val;
  }
  private saveAnim(sel: string, val: _Var) {
    getAnim(val).forEach((vv) => {
      this.base.ANIM.init(`${this.base.PREFIX}${vv}`, new Set()).add(sel);
    });
  }
  private process(
    name: string,
    k: string,
    v: any,
    props: Mapper<string, media | support[]>,
    data: CMapper,
  ) {
    if (v instanceof _Var) {
      this.saveAnim(name, v);
      props.ass(v.var, this.props(name, v.var, valToMedia(v.value)));
    } else if (k.startsWith(":") || k.startsWith(",")) {
      if (k.startsWith("::before") || k.startsWith("::after")) {
        if (isArr(v)) {
          const hasContent = v.some((mp) => "content" in mp);
          if (!hasContent) v.push({ content: "" });
        }
      }
      this.set(name + k, v, data);
    } else if (k.startsWith(" ")) {
      const slc = k.match(/^.*?\w/gm);
      const islc = slc?.[0].slice(0, -1);
      const lk = k.replaceAll(/, /gm, `, ${name}${islc}`);
      this.set(name + lk, v, data);
    } else if (isClassOrId(k)) {
      this.set(name + k, v, data);
    } else {
      props.set(k, this.props(name, k, valToMedia(v)));
    }
  }
  set(name: string, css: CSSinR, data: CMapper) {
    if (!isObj(css)) return;
    // -------------------------
    // -------------------------
    const props: Mapper<string, media | support[]> = new Mapper();

    if (css instanceof _Var) {
      this.saveAnim(name, css);
      props.ass(css.var, this.props(name, css.var, valToMedia(css.value)));
    } else if (css instanceof Medyas) {
      oItems(css._value).forEach(([k, v]) => {
        if (isDefined(v)) props.set(k, this.props(name, k, valToMedia(v)));
      });
    } else if (css instanceof support) {
      supportMedia(css);
      props.init("supports", []).push(css);
    } else if (isArr(css)) {
      css.forEach((cc) => {
        this.set(name, cc, data);
      });
    } else {
      oItems(css).forEach(([k, v]) => {
        return this.process(name, k, v, props, data);
      });
    }
    props.forEach((v, k) => {
      if (k === "supports") {
        data
          .init(name, new Mapper())
          .init(k, [])
          ?.push(...(v as any[]));
      } else {
        data.init(name, new Mapper()).set(k as any, v as any);
      }
    });
  }
}

//  styleshweet
