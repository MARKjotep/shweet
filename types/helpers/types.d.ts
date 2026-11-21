export type V = string | number | boolean;
export type obj<T> = Record<string, T>;
export type dict<K extends keyof any, T> = Record<K, T>;
export type maybePromise<T> = Promise<T> | T;
export type Partially<T> = {
    [K in keyof T]: T[K] | undefined;
};
