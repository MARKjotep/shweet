import { ngify, sparse } from "@ohmyqt/u";
import type { obj } from "../helpers";
import type { CSSinR, CSSValue } from "../type";

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
  light?: CSSValue;
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
  static readonly prop: mtype = Object.entries(breakpoints).reduce<obj<string>>(
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
    light: "(prefers-color-scheme: light)",
  };
  constructor(defValue?: CSSValue, g: obj<any> = {}) {
    const defM = media.default;
    const DM: obj<CSSValue> = {};

    if (defValue !== undefined) {
      reMedia(DM, defM, defValue, defM);
    }

    Object.entries(g).forEach(([k, v]) => {
      reMedia(DM, k, v, defM);
    });
    Object.assign(this, DM);
  }
  static get breakpoints() {
    return sparse<typeof breakpoints>(ngify(breakpoints)) ?? breakpoints;
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
      Object.entries(v).forEach(([k2, v2]) => {
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

type exmed = { [k: string]: undefined | CSSValue };

export function med(g: mtype & exmed): media;
export function med(defValue: CSSValue): media; // ✅ NEW
export function med(defValue: CSSValue, g: mtype & exmed): media;
export function med(defValueOrG: CSSValue | mtype, g?: mtype & exmed) {
  if (g) {
    return new media(defValueOrG as CSSValue, g);
  }
  if (typeof defValueOrG === "object") {
    return new media(undefined, defValueOrG);
  }
  return new media(defValueOrG as CSSValue, {});
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
  return new (this.constructor as new (options: MedyasOptions<Q>) => T)({
    prefix: mda,
    values: this["_values"],
    data: this["data"],
  });
}

/**
 * Constructor options for `Medyas` and its subclasses.
 *
 * Every field is optional so a subclass can be instantiated as `new Preset()`,
 * with only a prefix (`new Preset({ prefix: "md" })`), or with its own data and
 * shared media buckets.
 */
export interface MedyasOptions<Q = Record<string, any>> {
  prefix?: string;
  data?: Q;
  values?: Record<string, media>;
}

export class Medyas<T extends Medyas<T>, Q = Record<string, any>> {
  [k: number]: this;
  // name: string = "medyas";
  _prefix?: string | undefined;
  data: Q;
  protected _values: Record<string, media>;
  constructor({ prefix, data, values }: MedyasOptions<Q> = {}) {
    this._prefix = prefix;
    // Bucket records are shared with the instance that created this one so
    // media accessors such as `.MD` keep writing into the same declarations.
    this._values = values ?? {};
    Object.entries(this._values).forEach(([k, v]) => {
      if (!this._values[k]) {
        this._values[k] = med({});
      }
      Object.assign(this._values[k], v);
    });

    this.data = (data ?? {}) as Q;
  }
  get XS() {
    return <T>NEW.call(this, "xs");
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
    return <T>NEW.call(this, "mobile");
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
    Object.entries(val).forEach(([k, v]) => {
      if (!this._values[k]) {
        this._values[k] = med({});
      }
      Object.assign(this._values[k], VAL.call(this as any, v));
    });
  }
  get _value(): Record<string, media> {
    //
    return this._values;
  }
}
