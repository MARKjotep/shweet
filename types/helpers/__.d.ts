import type { obj } from "./types";
import { compareObjects, hasObjectChanges } from "./object";
import * as guards from "./guards";
declare class returner {
    static arr<T = string>(value?: unknown): T[];
    static num(value: unknown, fallback?: number): number;
    static str(value: unknown): string;
    static arr2obj(value: unknown[], switched?: boolean): Record<string, any>;
}
declare class Formatteer {
    val: unknown;
    constructor(val: unknown);
    get px(): string;
    get rem(): string;
    get pr(): string;
}
/**
 * Small public utility namespace preserved from the legacy helper barrel.
 */
export declare class __ {
    static rand(min?: number, max?: number): number;
    static fill(count: number, fill?: unknown): any[];
    static new({ dom, id, inner, }: {
        dom: keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap;
        id?: string;
        inner?: any;
    }): HTMLElement;
    static randFrom(source: unknown[] | object): unknown;
    static randArray<T>(source?: T[], length?: number, unique?: boolean): T[];
    static randomAZ: () => string;
    static makeID: (length: number) => string;
    static class(attributes: obj<any>, ...classes: (string | undefined | boolean)[]): void;
    static get O(): {
        vals: {
            <T>(o: {
                [s: string]: T;
            } | ArrayLike<T>): T[];
            (o: {}): any[];
        };
        keys: {
            (o: object): string[];
            (o: {}): string[];
        };
        items: {
            <T>(o: {
                [s: string]: T;
            } | ArrayLike<T>): [string, T][];
            (o: {}): [string, any][];
        };
        has: (target: object, key: PropertyKey) => boolean;
        ass: {
            <T extends {}, U>(target: T, source: U): T & U;
            <T extends {}, U, V>(target: T, source1: U, source2: V): T & U & V;
            <T extends {}, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;
            (target: object, ...sources: any[]): any;
        };
        len: (target?: object) => number;
    };
    static get is(): typeof guards;
    static get return(): typeof returner;
    static isHREF(path: string, href: string): boolean;
    static sleep: (ms?: number) => Promise<void>;
    static get screen(): "xs" | "sm" | "smd" | "md" | "lg" | "xl" | "xxl" | undefined;
    bytes(bytes: number): string;
    static format(value: any): Formatteer;
    static compareObjects: typeof compareObjects;
    static isObjectUdpated: typeof hasObjectChanges;
}
export {};
