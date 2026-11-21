import type { CSS, CSSF } from "../type";

/*
-------------------------

-------------------------
*/

export const Z = (cx: CSS, a: Record<string, [CSSF, Record<string, CSSF>]>) => {
  //
  for (const [maincls, [v, rc]] of Object.entries(a)) {
    // if (Array.isArray(v) && v.length) {
    // }
    cx[maincls] = v;
    for (const [kk, vv] of Object.entries(rc)) {
      const lt = kk.startsWith("$") ? kk.slice(1) : `${maincls}_${kk}`;
      cx[lt] = vv;
    }
  }
};

export const X = (cx: CSS, a: Record<string, CSSF | XZ>, mc?: string) => {
  //
  for (const [maincls, v] of Object.entries(a)) {
    const lv = Array.isArray(v) ? v : [v];
    const mx: CSSF[] = [];
    for (const ll of lv) {
      if (ll instanceof XZ) {
        //
        ll.$(maincls, cx);
      } else {
        mx.push(ll);
      }
    }
    const tl = mc ? `${mc}_${maincls}` : maincls;
    cx[tl] = mx;
  }
};

class XZ {
  constructor(
    public __: Record<string, CSSF>,
    private merge: boolean = false,
  ) {}
  $(mc: string, cx: CSS) {
    X(cx, this.__, this.merge ? mc : undefined);
  }
}

export const XX = (a: Record<string, CSSF>) => {
  return new XZ(a);
};

export const XY = (a: Record<string, CSSF>) => {
  return new XZ(a, true);
};
