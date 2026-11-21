import { isArray, Mapped } from "@ohmyqt/u";
import { isNumeric } from "../../helpers";
import type { obj } from "../../helpers";
import type { atCSS, CSS, CSSinR, fontFace, KFCSS } from "../../type";
import { Property } from "../property";
import { Value } from "../value";
import { Base, type CMapper } from "./base";

/*
-------------------------
DOM CLASS ID
-------------------------
*/
export class Cid extends Base<CSS> {
  set(target: Base, prop: string, val: CSSinR) {
    const nme = target.PRE + prop;

    target.PS.set(nme, val, target.DATA);
    return true;
  }
}

/*
-------------------------
@Keyframes
-------------------------
*/
export class Keyframes extends Base<KFCSS> {
  constructor(
    prefix: string = "",
    private webkit: boolean = true,
    unit?: string,
    source: string = "",
  ) {
    super("", prefix, false, unit, source);
  }
  set(target: Keyframes, prop: string, val: obj<any>) {
    const nme = target.PREFIX + prop;
    const VL = isArray<obj<any>>(val) ? val : [val];

    const dx: CMapper = new Mapped();
    VL.forEach((vv) => {
      Object.entries(vv).forEach(([key, value]) => {
        const normalizedKey = isNumeric(key) ? `${key}%` : key;
        target.PS.set(normalizedKey, value as CSSinR, dx);
      });
    });
    //
    target.ANIM.init(nme, new Set());

    target.DATA.set(`@keyframes ${nme}`, dx);

    if (this.webkit) {
      target.DATA.set(`@-webkit-keyframes ${nme}`, dx);
    }

    return true;
  }
}

/*
-------------------------
@
-------------------------
*/
export class At extends Base<{ import: atCSS; charset: atCSS }> {
  constructor(prefix: string = "", source: string = "") {
    super("@", prefix, undefined, undefined, source);
  }
  set(target: any, prop: string, val: string) {
    target.ARR.init(target.PRE + prop, new Set()).add(val);
    return target;
  }
}

/*
-------------------------
@FontFace
-------------------------
*/
export class FontFace extends Base<obj<fontFace>> {
  constructor(prefix: string = "", source: string = "") {
    super("@font-face", prefix, undefined, undefined, source);
    this.ARR.set(this.PRE, new Set());
  }
  set(target: any, prop: string, val: fontFace) {
    const PR = Object.entries({
      fontFamily: Value([prop], { quote: true }),
      ...val,
    }).map(([key, value]) => {
      return Property(key, value, this.UNIT);
    });

    target.ARR.get(target.PRE)?.add(PR.join("\n\t"));
    return true;
  }
}
