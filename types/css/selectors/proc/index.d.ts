import type { Base } from "../base";
import { Mapped } from "@ohmyqt/u";
import type { CSSinR } from "../../../type";
import { media } from "../../../media";
import { support } from "../../../support";
export declare class Proc {
    private base;
    constructor(base: Base);
    private prefixAnimationValues;
    private addPrefixToAnimation;
    private saveAnim;
    private processDeclaration;
    set(name: string, css: CSSinR, data: Mapped<string, Mapped<string, media | support[]>>): void;
}
