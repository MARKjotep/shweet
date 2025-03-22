import { isArr, isNumber, log, Mapper, obj, oItems } from "../../@";
import { aFrom } from "../../@/arr";
import { med, media, mtype } from "../../media";
import { support, supports } from "../../support";
import { atCSS, CSS, CSSinR, fontFace, KFCSS } from "../../type";
import { Property } from "../property";
import { Proc } from "./proc";

export type CMapper = Mapper<string, Mapper<string, media | support[]>>;

export class Base<T = Record<string, any>> {
  [k: string]: any;
  PS: Proc;
  PREFIX: string;
  ARR: Mapper<string, Set<string>> = new Mapper();
  CID: Mapper<string, string> = new Mapper();
  DATA: CMapper = new Mapper();
  ANIM: Mapper<string, Set<string>> = new Mapper();
  IMPORTED: Base[] = [];
  constructor(
    public PRE: string = "",
    prefix: string = "",
    public EXPORT?: boolean,
    public UNIT?: string,
  ) {
    this.PREFIX = prefix ? prefix + "_" : prefix;
    this.PS = new Proc(this as Base<any>);
  }
  get(target: Base, prop: string, receiver: any) {
    const nme = target.PRE + prop;
    if (target.DATA.has(nme)) {
      return nme;
    } else if (prop in target) {
      return target[prop];
    } else {
      return target.PRE + prop;
    }
  }
  set(target: any, prop: string, val: any): boolean {
    return false;
  }
  get css(): T {
    return new Proxy(this, this);
  }
  load(css: Base) {
    this.IMPORTED.push(css);
    return this;
  }
}

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
  ) {
    super("", prefix, false, unit);
  }
  set(target: Keyframes, prop: string, val: obj<any>) {
    const nme = target.PREFIX + prop;
    const VL = isArr(val) ? val : [val];

    const dx: CMapper = new Mapper();
    VL.forEach((vv) => {
      oItems(vv).forEach(([x, y]) => {
        let xx = isNumber(x) ? `${x}%` : x;
        target.PS.set(xx, y as CSSinR, dx);
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
  constructor(prefix: string = "") {
    super("@", prefix);
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
  constructor(prefix: string = "") {
    super("@font-face", prefix);
    this.ARR.set(this.PRE, new Set());
  }
  set(target: any, prop: string, val: fontFace) {
    const PR = oItems({ fontFamily: prop, ...val }).map(([k, v]) => {
      return Property(k, v, this.UNIT);
    });

    target.ARR.get(target.PRE)?.add(PR.join("\n\t"));
    return true;
  }
}
