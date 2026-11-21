import { type obj } from "../helpers";
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
export declare class media {
    [key: string]: any;
    static default: keyof mtype;
    static readonly prop: mtype;
    static readonly extra: mtype;
    constructor(defValue?: CSSValue, g?: obj<any>);
    static get breakpoints(): {
        xs: string;
        sm: string;
        smd: string;
        md: string;
        lg: string;
        xl: string;
        xxl: string;
    };
}
type exmed = {
    [k: string]: undefined | CSSValue;
};
export declare function med(g: mtype & exmed): media;
export declare function med(defValue: CSSValue): media;
export declare function med(defValue: CSSValue, g: mtype & exmed): media;
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
export declare class Medyas<T extends Medyas<T>, Q = Record<string, any>> {
    [k: number]: this;
    _prefix?: string | undefined;
    data: Q;
    protected _values: Record<string, media>;
    constructor({ prefix, data, values }?: MedyasOptions<Q>);
    get XS(): T;
    get SM(): T;
    get SMD(): T;
    get MD(): T;
    get LG(): T;
    get XL(): T;
    get XXL(): T;
    get NO_HOVER(): T;
    get MOBILE(): T;
    get PRINT(): T;
    get SCREEN(): T;
    get DARK(): T;
    set _value(val: CSSinR);
    get _value(): Record<string, media>;
}
export {};
