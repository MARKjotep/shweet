import { Mapped } from "@ohmyqt/u";
import type { CSS } from "../../type";
import type { media } from "../../media";
import type { support } from "../../support";
import { Proc } from "./proc";
export declare class Base<T = Record<string, any>> {
    PRE: string;
    EXPORT?: boolean | undefined;
    UNIT?: string | undefined;
    /** Source `__filename` of the instance that owns this handler. */
    SOURCE: string;
    [k: string]: any;
    PS: Proc;
    PREFIX: string;
    ARR: Mapped<string, Set<string>>;
    CID: Mapped<string, string>;
    DATA: Mapped<string, Mapped<string, media | support[]>>;
    ANIM: Mapped<string, Set<string>>;
    IMPORTED: Base[];
    constructor(PRE?: string, prefix?: string, EXPORT?: boolean | undefined, UNIT?: string | undefined, 
    /** Source `__filename` of the instance that owns this handler. */
    SOURCE?: string);
    get(target: Base, prop: string, receiver: any): any;
    set(target: any, prop: string, val: any): boolean;
    get css(): T;
    load(css: Base): this;
    __(f: CSS): void;
}
