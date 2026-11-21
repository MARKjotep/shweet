import type { Base, CMapper } from "../base";
import type { CSSinR } from "../../../type";
export declare class Proc {
    private base;
    constructor(base: Base);
    private prefixAnimationValues;
    private addPrefixToAnimation;
    private saveAnim;
    private processDeclaration;
    set(name: string, css: CSSinR, data: CMapper): void;
}
