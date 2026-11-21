import { Mapped } from "../../helpers";
import type { CSS } from "../../type";
import type { media } from "../../media";
import type { support } from "../../support";
import { Proc } from "./proc";
export type CMapper = Mapped<string, Mapped<string, media | support[]>>;
export declare class Base<T = Record<string, any>> {
    PRE: string;
    EXPORT?: boolean | undefined;
    UNIT?: string | undefined;
    [k: string]: any;
    PS: Proc;
    PREFIX: string;
    ARR: Mapped<string, Set<string>>;
    CID: Mapped<string, string>;
    DATA: CMapper;
    ANIM: Mapped<string, Set<string>>;
    IMPORTED: Base[];
    constructor(PRE?: string, prefix?: string, EXPORT?: boolean | undefined, UNIT?: string | undefined);
    get(target: Base, prop: string, receiver: any): any;
    set(target: any, prop: string, val: any): boolean;
    get css(): T;
    load(css: Base): this;
    __(f: CSS): void;
}
