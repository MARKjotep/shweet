import type { FontFace } from "../css/selectors";
import type { atCSS, CSSValue, KFCSS } from "../type";
import { media, type mtype } from "../media";
import type { DiagnosticHandler, OverrideMap, SaveOptions, ShweetOptions, __CSS, exmed } from "./options";
export declare class Shweet<T extends exmed = exmed> {
    [k: string]: any;
    path: string;
    name: string | undefined;
    prefix: string;
    exportMap?: boolean | undefined;
    onDiagnostic: DiagnosticHandler | undefined;
    private mediaFeatures;
    /** Original options, kept so {@link override} can rebuild a faithful clone. */
    private options;
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
    constructor(options: ShweetOptions<T>);
    get imported(): string[];
    /**
     * Return a clone of this instance with the given custom-property (var) values
     * overridden. Custom-property names stay stable; only values change. A flat
     * value applies to both light and dark modes, while `{ light, dark }` sets the
     * explicit pair.
     */
    override(overrides?: OverrideMap): this;
    med(g: mtype & T): media;
    med(defValue: CSSValue): media;
    med(defValue: CSSValue, g: mtype & T): media;
}
export declare function fileName(path: string): string | undefined;
