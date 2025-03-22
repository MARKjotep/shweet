import { log, Mapper, obj, V } from "../@";
import { _Var } from "../var";
import { media, Medyas } from "../media";

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
  //
  webkitBoxDecorationBreak: string;
  boxDecorationBreak: string;
  webkitBoxReflect: string;
}

export interface fontFace {
  src?: string;
  fontStretch?:
    | "condensed"
    | "ultra-condensed"
    | "extra-condensed"
    | "semi-condensed"
    | "expanded"
    | "semi-expanded"
    | "extra-expanded"
    | "ultra-expanded";
  fontStyle?: "normal" | "italic" | "oblique";
  fontWeight?:
    | "normal"
    | "bold"
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900";
  unicodeRange?: CSSValue;
}

export type CSSinR =
  | {
      [P in keyof xtraCSS]?: CSSValue | media;
    }
  | { [p: string]: CSSValue | media }
  | CSSinR[];

export type atCSS = string;

export type CSS = Record<string, CSSinR>;

type KFX = CSSinR | Medyas<any, {}>;

export type KFCSS = obj<{
  from?: KFX;
  to?: KFX;
  [percent: `${string}%`]: KFX;
}>;

// -------------------------
