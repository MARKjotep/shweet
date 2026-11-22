/**
 * Value-level number guard matching the migrated source's original behavior.
 * Unlike the utility package's strict `isNumber`, `NaN` is still a number here, which keeps
 * `Value` output unchanged for non-finite CSS values.
 */
declare const isNumber: (value: unknown) => value is number;
/**
 * Numeric-key guard matching the original helper used for keyframe keys.
 * Accepts numeric strings such as `"50"` so `50` becomes `"50%"`.
 */
declare const isNumeric: (value: unknown) => boolean;
declare const isClassOrId: (key: string) => boolean;

declare const guards_isClassOrId: typeof isClassOrId;
declare const guards_isNumber: typeof isNumber;
declare const guards_isNumeric: typeof isNumeric;
declare namespace guards {
  export {
    guards_isClassOrId as isClassOrId,
    guards_isNumber as isNumber,
    guards_isNumeric as isNumeric,
  };
}

/**
 * Enhanced Map data structure offering deep merging, transformation,
 * filtering, and safe path access.
 *
 * @template K - Key type (default: string)
 * @template V - Value type (default: any)
 */
declare class Mapped<K = string, V = any> extends Map<K, V> {
    constructor(entries?: readonly (readonly [K, V])[] | Record<string, V> | null);
    /**
     * Merges a key-value Record object into this map.
     */
    mergeObject(obj?: Record<string, any> | null): this;
    /**
     * Merges another Map or Mapper instance into this map.
     */
    mergeMap(sourceMap: Map<K, V>): this;
    /**
     * Merges properties of an object directly into a target key's stored object.
     */
    assign<T extends Record<string, any>>(key: K, obj: T): this;
    /**
     * Returns true if the specified key is missing from the map.
     */
    lacks(key: K): boolean;
    /**
     * Retrieves a key's value if present; otherwise sets and returns the default fallback value.
     */
    init(key: K, defaultValue: V): V;
    /**
     * Maps entries into a new Mapper instance using a transformation function.
     * @example const doubled = map.mapValues((val) => val * 2);
     */
    mapValues<R>(fn: (value: V, key: K, map: this) => R): Mapped<K, R>;
    /**
     * Filters entries into a new Mapper instance based on a predicate function.
     * @example const active = map.filter((val) => val.isActive);
     */
    filter(predicate: (value: V, key: K, map: this) => boolean): Mapped<K, V>;
    /**
     * Converts the Mapper instance into a plain JavaScript Object.
     * @example const obj = map.toObject();
     */
    toObject(): Record<string, V>;
    /**
     * Converts the Mapper to a JSON string representation.
     */
    toJson(): string;
    /**
     * Static helper: Constructs a Mapper from an array of objects grouped by a target property.
     * Named `fromGroup` to avoid static interface collision with native `Map.groupBy`.
     * @example const grouped = Mapper.fromGroup(users, "role");
     */
    static fromGroup<T extends Record<string, any>, K extends keyof T>(array: T[], key: K): Mapped<T[K], T[]>;
}

type ObjectChanges = {
    added: Record<string, unknown>;
    removed: Record<string, unknown>;
    modified: Record<string, {
        old: unknown;
        new: unknown;
    }>;
};
declare const compareObjects: (oldObject: object, newObject: object) => ObjectChanges;
declare const hasObjectChanges: (changes: ObjectChanges) => boolean;

type V = string | number | boolean;
type obj<T> = Record<string, T>;

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
declare class __ {
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

interface mtype {
    xs?: CSSValue;
    sm?: CSSValue;
    smd?: CSSValue;
    md?: CSSValue;
    lg?: CSSValue;
    xl?: CSSValue;
    xxl?: CSSValue;
    no_hover?: CSSValue;
    mobile?: CSSValue;
    print?: CSSValue;
    dark?: CSSValue;
    light?: CSSValue;
    screen?: CSSValue;
}
declare class media {
    [key: string]: any;
    static default: keyof mtype;
    static readonly prop: mtype;
    static readonly extra: mtype;
    constructor(defValue?: CSSValue, g?: obj<any>);
    static get breakpoints(): {
        xs: string;
        sm: string;
        smd: string;
        md: string;
        lg: string;
        xl: string;
        xxl: string;
    };
}
type exmed$1 = {
    [k: string]: undefined | CSSValue;
};
declare function med(g: mtype & exmed$1): media;
declare function med(defValue: CSSValue): media;
declare function med(defValue: CSSValue, g: mtype & exmed$1): media;
/**
 * Constructor options for `Medyas` and its subclasses.
 *
 * Every field is optional so a subclass can be instantiated as `new Preset()`,
 * with only a prefix (`new Preset({ prefix: "md" })`), or with its own data and
 * shared media buckets.
 */
interface MedyasOptions<Q = Record<string, any>> {
    prefix?: string;
    data?: Q;
    values?: Record<string, media>;
}
declare class Medyas<T extends Medyas<T>, Q = Record<string, any>> {
    [k: number]: this;
    _prefix?: string | undefined;
    data: Q;
    protected _values: Record<string, media>;
    constructor({ prefix, data, values }?: MedyasOptions<Q>);
    get XS(): T;
    get SM(): T;
    get SMD(): T;
    get MD(): T;
    get LG(): T;
    get XL(): T;
    get XXL(): T;
    get NO_HOVER(): T;
    get MOBILE(): T;
    get PRINT(): T;
    get SCREEN(): T;
    get DARK(): T;
    set _value(val: CSSinR);
    get _value(): Record<string, media>;
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
declare const Vars: <T extends Record<string, CSSValue | media>>(vr: T) => { [K in keyof T]: _Var; };

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
    webkitTouchCallout: string;
}
interface fontFace {
    src?: string | string[];
    fontStretch?: "condensed" | "ultra-condensed" | "extra-condensed" | "semi-condensed" | "expanded" | "semi-expanded" | "extra-expanded" | "ultra-expanded";
    fontStyle?: "normal" | "italic" | "oblique";
    fontWeight?: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
    unicodeRange?: CSSValue;
    fontDisplay: "auto" | "block" | "swap" | "fallback" | "optional";
}
type CSSinR = {
    [P in keyof xtraCSS]?: CSSValue | media;
} | {
    [p: string]: CSSValue | media;
} | CSSinR[];
type atCSS = string;
type CSSF = CSSinR | Record<string, CSSinR> | Medyas<any, {}>;
type CSS = Record<string, CSSinR | Record<string, CSSinR>>;
type KFX = CSSinR | Medyas<any, {}>;
type KFCSS = obj<{
    from?: KFX;
    to?: KFX;
    [percent: `${string}%`]: KFX;
}>;

declare class support {
    value: Mapped<string, CSSinR[]>;
    __: (...css: CSSinR[]) => this;
    constructor(css: CSSinR | string);
}
declare function supports(css: CSSinR | string): (...css: CSSinR[]) => support;

declare class ps {
    static attr(d: obj<string>): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static after(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static before(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static backdrop(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static cue(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static cueRegion(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static firstLetter(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static firstLine(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static marker(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static part(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static placeholder(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static selection(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static slotted(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static spellingError(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static targetText(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static viewTransition(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static viewTransitionGroup(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static viewTransitionImagePair(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static viewTransitionNew(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static viewTransitionOld(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static scrollbar(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static scrollbarThumb(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static scrollbarTrack(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static scrollbarCorner(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static active(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static anyLink(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static autofill(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static blank(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static checked(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static current(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static default(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static defined(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static disabled(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static empty(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static enabled(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static first(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static firstChild(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static firstOfType(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static fullscreen(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static future(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static focus(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static focusVisible(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static focusWithin(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static host(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static hover(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static indeterminate(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static inRange(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static invalid(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static lastChild(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static lastOfType(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static left(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static link(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static localLink(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static modal(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static onlyChild(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static onlyOfType(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static optional(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static outOfRange(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static past(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static pictureInPicture(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static placeholderShown(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static paused(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static playing(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static readOnly(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static readWrite(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static required(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static right(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static root(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static scope(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static target(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static targetWithin(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static userInvalid(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static valid(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static visited(xx?: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static dir(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static has(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static host_(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static hostContext(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static is(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static lang(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static not(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static nthChild(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static nthCol(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static nthLastChild(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static nthLastCol(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static nthLastOfType(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static nthOfType(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static state(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static where(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    /**
     * i.e outer-spin-button
     * @param xx string
     */
    static webkit(xx: V): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static and(str: string): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static child(str: string): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static desc(str: string): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static next(str: string): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static general(str: string): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
    };
    static withClass(str: string): (...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any> | undefined)[]) => {
        [x: string]: (Medyas<any, Record<string, any>> | _Var | obj<CSSValue> | support | CSSinR | undefined)[];
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
    static format(format: string): string;
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

declare class Proc {
    private base;
    constructor(base: Base);
    private prefixAnimationValues;
    private addPrefixToAnimation;
    private saveAnim;
    private processDeclaration;
    set(name: string, css: CSSinR, data: Mapped<string, Mapped<string, media | support[]>>): void;
}

declare class Base<T = Record<string, any>> {
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

declare class FontFace extends Base<obj<fontFace>> {
    constructor(prefix?: string, source?: string);
    set(target: any, prop: string, val: fontFace): boolean;
}

declare class Shweet<T extends exmed = exmed> {
    [k: string]: any;
    path: string;
    name: string | undefined;
    prefix: string;
    exportMap?: boolean | undefined;
    onDiagnostic: DiagnosticHandler | undefined;
    private mediaFeatures;
    protected _imported: Set<string>;
    d: __CSS;
    i: __CSS;
    c: __CSS;
    kf: KFCSS & {
        __: (a: KFCSS) => void;
    };
    at: {
        import: atCSS;
        charset: atCSS;
    };
    font: FontFace["css"];
    shweet: this;
    save: (x?: SaveOptions) => this;
    constructor({ __filename, name, prefix, shweets, exportMap, webkitKeyframes, mediaFeature, unit, onDiagnostic, }: ShweetOptions<T>);
    get imported(): string[];
    med(g: mtype & T): media;
    med(defValue: CSSValue): media;
    med(defValue: CSSValue, g: mtype & T): media;
}
declare function fileName(path: string): string | undefined;

type exmed = {
    [k: string]: undefined | CSSValue;
};
type DiagnosticSeverity = "warning" | "error";
/**
 * Structured, source-aware compiler diagnostic.
 *
 * The Proxy assignment API records no source spans, so diagnostics deliberately
 * carry no line/column information. `sourcePath` is the `__filename` of the
 * instance whose handler produced the diagnostic (including imported
 * instances), and `rule`/`selector` identify the affected at-rule/keyframe
 * step when one exists.
 */
interface CompileDiagnostic {
    /** Stable identifier suitable for programmatic filtering. */
    code: string;
    severity: DiagnosticSeverity;
    message: string;
    sourcePath: string;
    /** Affected rule, e.g. `@keyframes spin`. */
    rule?: string;
    /** Affected selector or keyframe step, e.g. `from`. */
    selector?: string;
}
type DiagnosticHandler = (diagnostic: CompileDiagnostic) => void;
interface SaveOptions {
    dir?: string | string[];
    mapDir?: string | string[];
    mapName?: string;
    minify?: boolean;
    shaker?: string[];
    include?: string[];
    includeAnimation?: string[];
    name?: string;
}
interface ShweetOptions<T extends exmed> {
    __filename: string;
    name?: string;
    prefix?: string;
    shweets?: Shweet | Shweet[];
    exportMap?: boolean;
    webkitKeyframes?: boolean;
    unit?: "rem" | "em" | "px" | "pt" | "pc";
    mediaFeature?: T;
    /**
     * Optional structured diagnostic sink. When supplied it replaces the
     * default console logging for diagnostics that were previously logged.
     */
    onDiagnostic?: DiagnosticHandler;
}
type __CSS = CSS & {
    __: (a: CSS) => void;
};

declare const Z: (cx: CSS, a: Record<string, [CSSF, Record<string, CSSF>]>) => void;
declare const X: (cx: CSS, a: Record<string, CSSF | XZ>, mc?: string) => void;
declare class XZ {
    __: Record<string, CSSF>;
    private merge;
    constructor(__: Record<string, CSSF>, merge?: boolean);
    $(mc: string, cx: CSS): void;
}
declare const XX: (a: Record<string, CSSF>) => XZ;
declare const XY: (a: Record<string, CSSF>) => XZ;

export { Medyas, Shweet, Value, Var, Vars, X, XX, XY, Z, __, f, fileName, med, media, ps, supports, v };
export type { CSS, CSSF, CSSValue, CSSinR, CompileDiagnostic, DiagnosticHandler, DiagnosticSeverity, KFCSS, MedyasOptions, VarType, atCSS, fontFace };
