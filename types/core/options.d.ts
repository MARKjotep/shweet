import type { CSS, CSSValue } from "../type";
import type { Shweet } from "./shweet";
export type exmed = {
    [k: string]: undefined | CSSValue;
};
export interface SaveOptions {
    dir?: string | string[];
    mapDir?: string | string[];
    mapName?: string;
    minify?: boolean;
    shaker?: string[];
    include?: string[];
    includeAnimation?: string[];
    name?: string;
}
export interface ShweetOptions<T extends exmed> {
    __filename: string;
    name?: string;
    prefix?: string;
    shweets?: Shweet | Shweet[];
    exportMap?: boolean;
    webkitKeyframes?: boolean;
    unit?: "rem" | "em" | "px" | "pt" | "pc";
    mediaFeature?: T;
}
export type __CSS = CSS & {
    __: (a: CSS) => void;
};
