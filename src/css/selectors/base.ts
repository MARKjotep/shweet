import { Mapped } from "../../helpers";
import type { CSS, CSSinR } from "../../type";
import type { media } from "../../media";
import type { support } from "../../support";
import { Proc } from "./proc";

export type CMapper = Mapped<string, Mapped<string, media | support[]>>;

export class Base<T = Record<string, any>> {
  [k: string]: any;
  PS: Proc;
  PREFIX: string;
  ARR: Mapped<string, Set<string>> = new Mapped();
  CID: Mapped<string, string> = new Mapped();
  DATA: CMapper = new Mapped();
  ANIM: Mapped<string, Set<string>> = new Mapped();
  IMPORTED: Base[] = [];
  constructor(
    public PRE: string = "",
    prefix: string = "",
    public EXPORT?: boolean,
    public UNIT?: string,
    /** Source `__filename` of the instance that owns this handler. */
    public SOURCE: string = "",
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
  __(f: CSS) {
    Object.entries(f).forEach(([k, v]) => {
      this.set(this, k, v);
    });
  }
}
