import type { CSS, CSSValue } from "../type";
import type { Shweet } from "./shweet";
export type exmed = {
    [k: string]: undefined | CSSValue;
};
export type DiagnosticSeverity = "warning" | "error";
/**
 * Structured, source-aware compiler diagnostic.
 *
 * The Proxy assignment API records no source spans, so diagnostics deliberately
 * carry no line/column information. `sourcePath` is the `__filename` of the
 * instance whose handler produced the diagnostic (including imported
 * instances), and `rule`/`selector` identify the affected at-rule/keyframe
 * step when one exists.
 */
export interface CompileDiagnostic {
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
export type DiagnosticHandler = (diagnostic: CompileDiagnostic) => void;
export interface SaveOptions {
    /**
     * Directory for the compiled CSS. Pass `"parent"` to write beside the folder
     * that contains the source module (`dirname(dirname(__filename))`); the
     * export map then defaults to the source folder unless `mapDir` is set.
     * Every other value is used literally, including a real folder named
     * `"parent"`. The parent form throws at the filesystem root.
     */
    dir?: string | string[];
    mapDir?: string | string[];
    mapName?: string;
    minify?: boolean;
    shaker?: string[];
    include?: string[];
    includeAnimation?: string[];
    name?: string;
    /**
     * Folds the same-selector `:root` blocks emitted in one save into one block
     * per media bucket, preserving declaration order. Defaults to `false`, which
     * keeps the current output byte-identical.
     */
    mergeRoot?: boolean;
}
/** One explicit color-scheme value pair accepted by `Shweet.override`. */
export interface OverrideModePair {
    /** Value used inside the light color scheme. */
    light?: CSSValue;
    /** Value used inside the dark color scheme. */
    dark?: CSSValue;
}
/**
 * Replacement value for one `Shweet.override` target. A flat value applies to
 * both color schemes; an explicit pair sets each scheme independently.
 */
export type OverrideValue = CSSValue | OverrideModePair;
/** Token value replacements keyed by camel-cased custom-property name. */
export type OverrideMap = Record<string, OverrideValue>;
export interface ShweetOptions<T extends exmed> {
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
export type __CSS = CSS & {
    __: (a: CSS) => void;
};
