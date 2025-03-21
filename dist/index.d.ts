declare const isFN: (v: any) => v is Function;
declare const isAsync: (v: any) => v is Function;
declare const isPromise: (v: any) => v is Function;
declare const isNumber: (value: any) => boolean;
declare const isDict: (val: any) => boolean;
declare const isPlainObject: (value: any) => boolean;
declare const isArraybuff: (val: any) => val is string | ArrayBuffer | Uint8Array<ArrayBufferLike>;
declare const isClassOrId: (k: string) => boolean;
declare const isBool: (v: any) => v is boolean;
declare const isStr: (v: any) => v is string;
declare const isArr: (v: any) => v is any[];
declare const isObj: (v: any) => v is object;
declare const isNum: (v: any) => v is number;
declare const isNull: (v: any) => v is null;
declare const isNotNull: <T>(v: T) => v is Exclude<T, null>;
declare const isUndefined: (v: any) => v is undefined;
declare const isDefined: <T>(v: T) => v is Exclude<T, undefined>;
declare const isInt: (str: string) => boolean;
declare const isWindow: boolean;
declare const isNotWindow: boolean;

declare const is_isArr: typeof isArr;
declare const is_isArraybuff: typeof isArraybuff;
declare const is_isAsync: typeof isAsync;
declare const is_isBool: typeof isBool;
declare const is_isClassOrId: typeof isClassOrId;
declare const is_isDefined: typeof isDefined;
declare const is_isDict: typeof isDict;
declare const is_isFN: typeof isFN;
declare const is_isInt: typeof isInt;
declare const is_isNotNull: typeof isNotNull;
declare const is_isNotWindow: typeof isNotWindow;
declare const is_isNull: typeof isNull;
declare const is_isNum: typeof isNum;
declare const is_isNumber: typeof isNumber;
declare const is_isObj: typeof isObj;
declare const is_isPlainObject: typeof isPlainObject;
declare const is_isPromise: typeof isPromise;
declare const is_isStr: typeof isStr;
declare const is_isUndefined: typeof isUndefined;
declare const is_isWindow: typeof isWindow;
declare namespace is {
  export { is_isArr as isArr, is_isArraybuff as isArraybuff, is_isAsync as isAsync, is_isBool as isBool, is_isClassOrId as isClassOrId, is_isDefined as isDefined, is_isDict as isDict, is_isFN as isFN, is_isInt as isInt, is_isNotNull as isNotNull, is_isNotWindow as isNotWindow, is_isNull as isNull, is_isNum as isNum, is_isNumber as isNumber, is_isObj as isObj, is_isPlainObject as isPlainObject, is_isPromise as isPromise, is_isStr as isStr, is_isUndefined as isUndefined, is_isWindow as isWindow };
}

type V = string | number | boolean;
type obj<T> = Record<string, T>;

/**
 * A custom Map implementation that provides additional utility methods for working with objects and maps.
 *
 * @template K - The type of the keys in the map.
 * @template V - The type of the values in the map.
 */
declare class Mapper<K, V> extends Map<K, V> {
    obj(obj?: object | null): void;
    map(map: Mapper<K, V>): void;
    ass<T>(key: K, obj: T): void;
    lacks(key: K): boolean;
    init(key: K, val: V): V;
}

declare class log {
    static set i(a: any);
    static set e(a: any);
    static set w(a: any);
}

declare class __ {
    static rand(min?: number, max?: number): number;
    static fill(count: number, fill?: any): any[];
    static new({ dom, id, inner, }: {
        dom: keyof HTMLElementTagNameMap;
        id?: string;
        inner?: any;
    }): HTMLElement;
    static randFrom(arr: any[] | Object): any;
    static randomAZ: () => string;
    static makeID: (length: number) => string;
    static class(a: obj<any>, classes: string[]): void;
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
        has: (o: object, v: PropertyKey) => boolean;
        ass: {
            <T extends {}, U>(target: T, source: U): T & U;
            <T extends {}, U, V>(target: T, source1: U, source2: V): T & U & V;
            <T extends {}, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;
            (target: object, ...sources: any[]): any;
        };
        len: (obj?: {}) => number;
    };
    static get is(): typeof is;
    static get return(): typeof returner;
    static sleep: (ms?: number) => Promise<unknown>;
}
declare class returner {
    static array(val: any): any[];
}

declare class _Var {
    k: string;
    fallback?: CSSValue;
    var: string;
    value: media;
    constructor(vr?: obj<CSSValue | media>, fallback?: CSSValue);
    __(fallback?: CSSValue): string;
    new(val: CSSValue, fallback?: CSSValue): _Var;
}
declare const Var: (vr: obj<CSSValue | media>, fallback?: CSSValue) => _Var;

type CSSValue = V | _Var | undefined | CSSValue[];
type VarType = _Var;
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
}
interface fontFace {
    src?: string;
    fontStretch?: "condensed" | "ultra-condensed" | "extra-condensed" | "semi-condensed" | "expanded" | "semi-expanded" | "extra-expanded" | "ultra-expanded";
    fontStyle?: "normal" | "italic" | "oblique";
    fontWeight?: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
    unicodeRange?: CSSValue;
}
type CSSinR = {
    [P in keyof xtraCSS]?: CSSValue | media;
} | {
    [p: string]: CSSValue | media;
} | CSSinR[];
type atCSS = string;
type CSS = Record<string, CSSinR>;
type KFX = CSSinR | Medyas<any, {}>;
type KFCSS = obj<{
    from?: KFX;
    to?: KFX;
    [percent: `${string}%`]: KFX;
}>;

interface mtype {
    xs?: CSSValue;
    sm?: CSSValue;
    smd?: CSSValue;
    md?: CSSValue;
    lg?: CSSValue;
    xl?: CSSValue;
    xxl?: CSSValue;
    no_hover?: CSSValue;
    print?: CSSValue;
    dark?: CSSValue;
    screen?: CSSValue;
}
declare class media {
    [key: string]: any;
    static default: keyof mtype;
    static readonly prop: mtype;
    static readonly extra: mtype;
    constructor(defValue?: CSSValue, g?: obj<any>);
    static get breakpoints(): any;
}
declare function med(g: mtype & {
    [k: string]: undefined | CSSValue;
}): media;
declare function med(defValue: CSSValue, g: mtype & {
    [k: string]: undefined | CSSValue;
}): media;
interface MedCFG<Q = Record<string, any>> {
    prefix?: string;
    data: Q;
    values: Record<string, media>;
}
declare class Medyas<T extends Medyas<T>, Q = Record<string, any>> {
    [k: number]: this;
    _prefix?: string;
    data: Q;
    protected _values: Record<string, media>;
    constructor({ prefix, data, values }?: MedCFG);
    get XS(): Medyas<T, Q>;
    get SM(): T;
    get SMD(): T;
    get MD(): T;
    get LG(): T;
    get XL(): T;
    get XXL(): T;
    get NO_HOVER(): T;
    get PRINT(): T;
    get SCREEN(): T;
    get DARK(): T;
    set _value(val: CSSinR);
    get _value(): CSSinR;
}

declare class support {
    value: Mapper<string, CSSinR[]>;
    __: (...css: CSSinR[]) => this;
    constructor(css: CSSinR | string);
}
declare function supports(css: CSSinR | string): (...css: CSSinR[]) => support;

declare class Proc {
    private base;
    constructor(base: Base);
    private props;
    private addPrefixToAnimation;
    private saveAnim;
    private process;
    set(name: string, css: CSSinR, data: CMapper): void;
}

type CMapper = Mapper<string, Mapper<string, media | support[]>>;
declare class Base<T = Record<string, any>> {
    PRE: string;
    EXPORT?: boolean | undefined;
    UNIT?: string | undefined;
    [k: string]: any;
    PS: Proc;
    PREFIX: string;
    ARR: Mapper<string, Set<string>>;
    CID: Mapper<string, string>;
    DATA: CMapper;
    ANIM: Mapper<string, Set<string>>;
    IMPORTED: Base[];
    constructor(PRE?: string, prefix?: string, EXPORT?: boolean | undefined, UNIT?: string | undefined);
    get(target: Base, prop: string, receiver: any): any;
    set(target: any, prop: string, val: any): boolean;
    get css(): T;
    load(css: Base): this;
}
declare class FontFace extends Base<obj<fontFace>> {
    constructor(prefix?: string);
    set(target: any, prop: string, val: fontFace): boolean;
}

declare class ps {
    static attr(d: obj<string>): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static after(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static before(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static backdrop(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static cue(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static cueRegion(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static firstLetter(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static firstLine(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static marker(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static part(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static placeholder(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static selection(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static slotted(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static spellingError(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static targetText(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static viewTransition(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static viewTransitionGroup(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static viewTransitionImagePair(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static viewTransitionNew(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static viewTransitionOld(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static scrollbar(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static scrollbarThumb(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static scrollbarTrack(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static scrollbarCorner(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static active(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static anyLink(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static autofill(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static blank(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static checked(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static current(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static default(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static defined(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static disabled(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static empty(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static enabled(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static first(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static firstChild(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static firstOfType(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static fullscreen(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static future(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static focus(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static focusVisible(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static focusWithin(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static host(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static hover(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static indeterminate(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static inRange(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static invalid(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static lastChild(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static lastOfType(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static left(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static link(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static localLink(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static modal(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static onlyChild(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static onlyOfType(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static optional(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static outOfRange(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static past(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static pictureInPicture(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static placeholderShown(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static paused(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static playing(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static readOnly(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static readWrite(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static required(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static right(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static root(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static scope(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static target(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static targetWithin(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static userInvalid(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static valid(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static visited(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static dir(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static has(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static host_(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static hostContext(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static is(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static lang(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static not(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static nthChild(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static nthCol(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static nthLastChild(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static nthLastCol(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static nthLastOfType(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static nthOfType(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static state(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static where(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static and(str: string): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static child(str: string): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static desc(str: string): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static next(str: string): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static general(str: string): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
    static withClass(str: string): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]) => {
        [x: string]: (_Var | CSSinR | Medyas<any, Record<string, any>> | obj<CSSValue> | support)[];
    };
}

declare class g {
    static minmax(min: CSSValue, max: CSSValue): string;
    static fitContent(len: CSSValue): string;
    static repeat(count: CSSValue, ...tracks: CSSValue[]): string;
}
declare class f extends g {
    static attr(name: CSSValue, type?: CSSValue, fallback?: CSSValue): string;
    static blur(blur: CSSValue): string;
    static brightness(brightness: CSSValue): string;
    static calc(...calc: CSSValue[]): string;
    static circle(radius: CSSValue, position?: CSSValue): string;
    static clamp(min: CSSValue, preferred: CSSValue, max: CSSValue): string;
    /**
     *
     * @param colorInterpolation in + srgb, srgb-linear, display-p3, a98-rgb, prophoto-rgb, rec2020, lab, oklab, xyz, xyz-d50, xyz-d65, hsl, hwb, lch, and oklch
     * @param color1 color, mix%
     * @param color2 color,  mix%
     */
    static colorMix(colorInterpolation: CSSValue, color1: CSSValue | CSSValue[], color2: CSSValue | CSSValue[]): string;
    static conicGradient(...sfs: CSSValue[]): string;
    static contrast(contrast: CSSValue): string;
    /**
     * Numeric values. x1 and x2 must be a number from 0 to 1
     */
    static cubicBezier(x1: CSSValue, y1: CSSValue, x2: CSSValue, y2: CSSValue): string;
    /**
     * @param sfs h-shadow v-shadow blur spread color
     */
    static dropShadow(...sfs: CSSValue[]): string;
    static grayscale(grayscale: CSSValue): string;
    static hsl(hue: CSSValue, saturation: CSSValue, lightness: CSSValue): string;
    static hsla(hue: CSSValue, saturation: CSSValue, lightness: CSSValue, A?: CSSValue): string;
    static hueRotate(degree: CSSValue): string;
    static inset(...sfs: CSSValue[]): string;
    static invert(percent: CSSValue): string;
    static linearGradient(...sfs: CSSValue[]): string;
    static matrix(scaleX: CSSValue, skewY: CSSValue, skewX: CSSValue, scaleY: CSSValue, translateX: CSSValue, translateY: CSSValue): string;
    static matrix3d(a1: CSSValue[], a2: CSSValue[], a3: CSSValue[], t4: CSSValue[]): string;
    static max(...sfs: CSSValue[]): string;
    static min(...sfs: CSSValue[]): string;
    static opacity(percent: CSSValue): string;
    static path(path: CSSValue): string;
    static clipPath(fillRule: CSSValue, path: CSSValue): string;
    static perspective(value: CSSValue): string;
    static polygon(...lengths: CSSValue[]): string;
    static ray(...sfs: CSSValue[]): string;
    static radialGradient(...sfs: CSSValue[]): string;
    static repeatingConicGradient(...sfs: CSSValue[]): string;
    static repeatingLinearGradient(...sfs: CSSValue[]): string;
    static repeatingRadialGradient(...sfs: CSSValue[]): string;
    static rgb(R: CSSValue, G: CSSValue, B: CSSValue): string;
    static rgba(R: CSSValue, G: CSSValue, B: CSSValue, A?: CSSValue): string;
    static rotate(R: CSSValue): string;
    static rotate3d(x: CSSValue, y: CSSValue, z: CSSValue, angle: CSSValue): string;
    static rotateX(X: CSSValue): string;
    static rotateY(Y: CSSValue): string;
    static rotateZ(Z: CSSValue): string;
    static saturate(...sfs: CSSValue[]): string;
    static scale(sx: CSSValue, sy?: CSSValue): string;
    static scale3d(sx: CSSValue, sy: CSSValue, sz: CSSValue): string;
    static scaleX(X: CSSValue): string;
    static scaleY(Y: CSSValue): string;
    static scaleZ(Z: CSSValue): string;
    static sepia(percent: CSSValue): string;
    static skew(...sfs: CSSValue[]): string;
    static skewX(X: CSSValue): string;
    static skewY(Y: CSSValue): string;
    static steps(n: CSSValue, position: "start" | "end" | "no" | "jump-start" | "jump-end" | "jump-none" | "jump-both"): string;
    /**
     * Translate(X,Y)
     */
    static translate(...sfs: CSSValue[]): string;
    static translate3d(...sfs: CSSValue[]): string;
    static translateX(X: CSSValue): string;
    static translateY(Y: CSSValue): string;
    static translateZ(...sfs: CSSValue[]): string;
    static url(url: CSSValue): string;
    static var(st: string, opt?: CSSValue): string;
}

declare const v: {
    important: string;
    visible: string;
    hidden: string;
    auto: string;
    none: string;
    clip: string;
    scroll: string;
    initial: string;
    inherit: string;
    flex: string;
    center: string;
    flex_start: string;
    flex_end: string;
    space_evenly: string;
    stretch: string;
    wrap: string;
    column: string;
    column_reverse: string;
    row: string;
    row_reverse: string;
    space_between: string;
    space_around: string;
    pr100: string;
    pr50: string;
    i100vh: string;
    i100vw: string;
    block: string;
    sticky: string;
    fixed: string;
    absolute: string;
    relative: string;
    pointer: string;
    grabbing: string;
    checkbox: string;
    solid: string;
    inset: string;
    bold: string;
    currentColor: string;
    forwards: string;
    text: string;
    norepeat: string;
    nowrap: string;
    difference: string;
    preserve3d: string;
};

interface propCfg {
    rem?: boolean;
    degree?: boolean;
    quote?: boolean;
    delimeter?: string;
    percent?: boolean;
    second?: boolean;
    delimeter_arr?: string;
    percent_arr?: string;
    unit?: string;
}
type undefNull = CSSValue | undefined | null | undefNull[];
declare const Value: (val: CSSValue | undefNull, cfg?: propCfg) => string;

interface saveCSS {
    dir?: string | string[];
    mapDir?: string;
    mapName?: string;
    minify?: boolean;
    shaker?: string[];
    include?: string[];
    includeAnimation?: string[];
}
interface shweetCFG {
    __filename: string;
    name?: string;
    prefix?: string;
    Shweet?: Shweet | Shweet[];
    exportMap?: boolean;
    webkitKeyframes?: boolean;
    unit?: "rem" | "em" | "px" | "pt" | "pc";
}
declare class Shweet {
    [k: string]: any;
    path: string;
    name: string;
    prefix: string;
    exportMap?: boolean;
    protected _imported: Set<string>;
    d: CSS;
    i: CSS;
    c: CSS;
    kf: KFCSS;
    at: {
        import: atCSS;
        charset: atCSS;
    };
    font: FontFace["css"];
    shweet: this;
    save: ({}: saveCSS) => this;
    constructor({ __filename, name, prefix, Shweet: Sheese, exportMap, webkitKeyframes, unit, }: shweetCFG);
    get imported(): string[];
}
declare function fileName(path: string): string;

export { type CSS, type CSSValue, type CSSinR, type KFCSS, Medyas, Shweet, Value, Var, type VarType, __, type atCSS, f, fileName, type fontFace, log, med, media, ps, supports, v };
