import { log, ngify, oAss, obj, oItems, sparse } from "../@";
import { CSSinR, CSSValue } from "../type";

export interface mtype {
  xs?: CSSValue;
  sm?: CSSValue;
  smd?: CSSValue;
  md?: CSSValue;
  lg?: CSSValue;
  xl?: CSSValue;
  xxl?: CSSValue;
  no_hover?: CSSValue;
  mobile?: CSSValue;
  print?: CSSValue;
  dark?: CSSValue;
  screen?: CSSValue;
}

const breakpoints = {
  xs: "480px",
  sm: "480px",
  smd: "624px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  xxl: "1536px",
};

export class media {
  [key: string]: any;
  static default: keyof mtype = "xs";
  static readonly prop: mtype = oItems(breakpoints).reduce<obj<string>>(
    (r, [k, v], ind) => {
      r[k] = `(${ind == 0 ? "max-width" : "min-width"}: ${v})`;
      return r;
    },
    {},
  );
  static readonly extra: mtype = {
    no_hover: "(pointer: coarse)",
    mobile: "(pointer: coarse)",
    print: "print",
    screen: "screen",
    dark: "(prefers-color-scheme: dark)",
  };
  constructor(defValue?: CSSValue, g: obj<any> = {}) {
    const defM = media.default;
    const DM: obj<CSSValue> = {};

    if (defValue !== undefined) {
      reMedia(DM, defM, defValue, defM);
    }

    oItems(g).forEach(([k, v]) => {
      reMedia(DM, k, v, defM);
    });
    oAss(this, DM);
  }
  static get breakpoints() {
    return sparse(ngify(breakpoints));
  }
}

const reMedia = (
  DM: obj<CSSValue>,
  k: string,
  v: CSSValue | media,
  def: keyof mtype,
) => {
  if (v !== undefined) {
    if (v instanceof media) {
      oItems(v).forEach(([k2, v2]) => {
        if (def !== k) {
          if (k !== k2) {
            if (def === k2) {
              reMedia(DM, k, v2, def);
            } else {
              reMedia(DM, `${k}-${k2}`, v2, def);
            }
          } else {
            reMedia(DM, k2, v2, def);
          }
        } else {
          reMedia(DM, k2, v2, def);
        }
      });
    } else {
      DM[k] = v;
    }
  }
};

export function med(g: mtype & { [k: string]: undefined | CSSValue }): media;
export function med(
  defValue: CSSValue,
  g: mtype & { [k: string]: undefined | CSSValue },
): media;
export function med(
  defValueOrG: CSSValue | mtype,
  g?: mtype & { [k: string]: undefined | CSSValue },
) {
  if (g) {
    return new media(defValueOrG as CSSValue, g);
  }
  return new media(undefined, defValueOrG as mtype);
}

function VAL(this: Medyas<any>, val: any): media {
  if (this["_prefix"]) {
    return med({ [this["_prefix"]]: val });
  } else {
    return med({ xs: val });
  }
}
function NEW<T extends Medyas<T>, Q extends Record<string, any>>(
  this: Medyas<T, Q>,
  mda: string,
) {
  return new (this.constructor as new ({ prefix, data, values }: MedCFG) => T)({
    prefix: mda,
    values: this["_values"],
    data: this["data"],
  });
}

interface MedCFG<Q = Record<string, any>> {
  prefix?: string;
  data: Q;
  values: Record<string, media>;
}

export class Medyas<T extends Medyas<T>, Q = Record<string, any>> {
  [k: number]: this;
  _prefix?: string;
  data: Q;
  protected _values: Record<string, media>;
  constructor(
    { prefix, data, values }: MedCFG = {
      data: {},
      values: {},
    },
  ) {
    this._prefix = prefix;
    this._values = values;
    oItems(values).forEach(([k, v]) => {
      if (!this._values[k]) {
        this._values[k] = med({});
      }
      oAss(this._values[k], v);
    });

    this.data = data as Q;
  }
  get XS() {
    return <Medyas<T, Q>>NEW.call(this as any, "xs");
  }
  get SM() {
    return <T>NEW.call(this, "sm");
  }
  get SMD() {
    return <T>NEW.call(this, "smd");
  }
  get MD() {
    return <T>NEW.call(this, "md");
  }
  get LG() {
    return <T>NEW.call(this, "lg");
  }
  get XL() {
    return <T>NEW.call(this, "xl");
  }
  get XXL() {
    return <T>NEW.call(this, "xxl");
  }
  get NO_HOVER() {
    return <T>NEW.call(this, "no_hover");
  }
  get MOBILE() {
    return <T>NEW.call(this, "no_hover");
  }
  get PRINT() {
    return <T>NEW.call(this, "print");
  }
  get SCREEN() {
    return <T>NEW.call(this, "screen");
  }
  get DARK() {
    return <T>NEW.call(this, "dark");
  }
  set _value(val: CSSinR) {
    oItems(val).forEach(([k, v]) => {
      if (!this._values[k]) {
        this._values[k] = med({});
      }
      oAss(this._values[k], VAL.call(this as any, v));
    });
  }
  get _value() {
    //
    return this._values;
  }
}
