import type { obj, V } from "../helpers";
import type { _Var } from "../var";
import type { media, Medyas } from "../media";
export type CSSValue = V | _Var | undefined | CSSValue[];
export type VarType = _Var;
interface xtraCSS extends Partial<CSSStyleDeclaration> {
    src?: string;
    webkitBackdropFilter?: string;
    webkitTextFillColor?: string;
    webkitFontSmoothing?: string;
    webkitTapHighlightColor?: string;
    textFillColor?: string;
    lineClamp?: string;
    textJustify?: string;
    webkitBoxDecorationBreak: string;
    boxDecorationBreak: string;
    webkitBoxReflect: string;
    webkitTouchCallout: string;
}
export interface fontFace {
    src?: string | string[];
    fontStretch?: "condensed" | "ultra-condensed" | "extra-condensed" | "semi-condensed" | "expanded" | "semi-expanded" | "extra-expanded" | "ultra-expanded";
    fontStyle?: "normal" | "italic" | "oblique";
    fontWeight?: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
    unicodeRange?: CSSValue;
    fontDisplay: "auto" | "block" | "swap" | "fallback" | "optional";
}
export type CSSinR = {
    [P in keyof xtraCSS]?: CSSValue | media;
} | {
    [p: string]: CSSValue | media;
} | CSSinR[];
export type atCSS = string;
export type CSSF = CSSinR | Record<string, CSSinR> | Medyas<any, {}>;
export type CSS = Record<string, CSSinR | Record<string, CSSinR>>;
type KFX = CSSinR | Medyas<any, {}>;
export type KFCSS = obj<{
    from?: KFX;
    to?: KFX;
    [percent: `${string}%`]: KFX;
}>;
export {};
