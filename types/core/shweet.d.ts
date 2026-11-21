import type { FontFace } from "../css/selectors";
import type { atCSS, CSSValue, KFCSS } from "../type";
import { media, type mtype } from "../media";
import type { SaveOptions, ShweetOptions, __CSS, exmed } from "./options";
export declare class Shweet<T extends exmed = exmed> {
    [k: string]: any;
    path: string;
    name: string | undefined;
    prefix: string;
    exportMap?: boolean | undefined;
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
    constructor({ __filename, name, prefix, shweets, exportMap, webkitKeyframes, mediaFeature, unit, }: ShweetOptions<T>);
    get imported(): string[];
    med(g: mtype & T): media;
    med(defValue: CSSValue): media;
    med(defValue: CSSValue, g: mtype & T): media;
}
export declare function fileName(path: string): string | undefined;
