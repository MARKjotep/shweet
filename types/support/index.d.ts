import { Mapped } from "@ohmyqt/u";
import type { CSSinR } from "../type";
export declare class support {
    value: Mapped<string, CSSinR[]>;
    __: (...css: CSSinR[]) => this;
    constructor(css: CSSinR | string);
}
export declare function supports(css: CSSinR | string): (...css: CSSinR[]) => support;
