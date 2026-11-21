import type { CSS, CSSF } from "../type";
export declare const Z: (cx: CSS, a: Record<string, [CSSF, Record<string, CSSF>]>) => void;
export declare const X: (cx: CSS, a: Record<string, CSSF | XZ>, mc?: string) => void;
declare class XZ {
    __: Record<string, CSSF>;
    private merge;
    constructor(__: Record<string, CSSF>, merge?: boolean);
    $(mc: string, cx: CSS): void;
}
export declare const XX: (a: Record<string, CSSF>) => XZ;
export declare const XY: (a: Record<string, CSSF>) => XZ;
export {};
