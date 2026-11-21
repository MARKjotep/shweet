import type { CSSValue } from "../../../type";
import { media } from "../../../media";
import type { support } from "../../../support";
export declare const valToMedia: (val: CSSValue | media) => media;
/**
 * Parses the legacy `"property: value; ..."` string form.
 *
 * Declarations are separated by top-level semicolons and split at the first
 * top-level colon. Quoted separators, escapes, nested functions, and data URLs
 * are preserved. Custom properties keep their original name and token content;
 * their numeric-looking values are not converted.
 */
export declare function cssStringToObject(css: string): any;
interface AnimationValueResult {
    value: string;
    names: string[];
}
/**
 * Prefixes animation names in a comma-separated `animation` shorthand or
 * `animationName` list. Timing, easing, iteration, direction, fill, and
 * play-state tokens are left alone. Ambiguous values (unknown functions,
 * escaped identifiers, extra name candidates) are returned unchanged.
 */
export declare const prefixAnimationValue: (value: string, prefix: string, property?: string) => AnimationValueResult;
/**
 * Normalizes every value attached to a `supports()` declaration in place.
 */
export declare const supportMedia: (css: support) => void;
/**
 * Extracts the animation name(s) from a value. The second parameter is kept
 * for source compatibility with the legacy helper, but results are always
 * returned in a fresh array.
 */
export declare const getAnim: (val: CSSValue | CSSValue[], _accumulator?: string[]) => string[];
export {};
