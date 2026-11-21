import { type obj } from "../../helpers";
import type { atCSS, CSS, CSSinR, fontFace, KFCSS } from "../../type";
import { Base } from "./base";
export declare class Cid extends Base<CSS> {
    set(target: Base, prop: string, val: CSSinR): boolean;
}
export declare class Keyframes extends Base<KFCSS> {
    private webkit;
    constructor(prefix?: string, webkit?: boolean, unit?: string, source?: string);
    set(target: Keyframes, prop: string, val: obj<any>): boolean;
}
export declare class At extends Base<{
    import: atCSS;
    charset: atCSS;
}> {
    constructor(prefix?: string, source?: string);
    set(target: any, prop: string, val: string): any;
}
export declare class FontFace extends Base<obj<fontFace>> {
    constructor(prefix?: string, source?: string);
    set(target: any, prop: string, val: fontFace): boolean;
}
