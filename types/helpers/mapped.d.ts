/**
 * Ordered map used throughout Shweet's collection and compilation pipeline.
 * It preserves insertion order and adds the merge/init helpers the compiler
 * relies on. Declared locally so public Shweet types do not depend on a
 * third-party package.
 *
 * @template K - Key type (default: string)
 * @template V - Value type (default: any)
 */
export declare class Mapped<K = string, V = any> extends Map<K, V> {
    constructor(entries?: readonly (readonly [K, V])[] | Record<string, V> | null);
    mergeObject(obj?: Record<string, any> | null): this;
    mergeMap(sourceMap: Map<K, V>): this;
    assign<T extends Record<string, any>>(key: K, obj: T): this;
    lacks(key: K): boolean;
    init(key: K, defaultValue: V): V;
    mapValues<R>(fn: (value: V, key: K, map: this) => R): Mapped<K, R>;
    filter(predicate: (value: V, key: K, map: this) => boolean): Mapped<K, V>;
    toObject(): Record<string, V>;
    toJson(): string;
    static fromGroup<T extends Record<string, any>, K extends keyof T>(array: T[], key: K): Mapped<T[K], T[]>;
}
