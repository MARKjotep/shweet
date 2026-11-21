import { type obj } from "../helpers";
import { media } from "../media";
import type { CSSValue } from "../type";
export declare class _Var {
    k: string;
    fallback?: CSSValue;
    var: string;
    value: media;
    constructor(vr?: obj<CSSValue | media>, fallback?: CSSValue);
    __(fallback?: CSSValue): string;
    new(val: CSSValue, fallback?: CSSValue): _Var;
}
export declare const Var: (vr: obj<CSSValue | media>, fallback?: CSSValue) => _Var;
export declare const Vars: <T extends Record<string, CSSValue | media>>(vr: T) => { [K in keyof T]: _Var; };
