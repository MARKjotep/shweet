/**
 * Whitespace minification with a bounded token scanner.
 *
 * The scanner is intentionally not a CSS parser. It protects input regions
 * where ordinary punctuation/whitespace rewriting would be unsafe (quoted
 * strings, `url(...)` payloads, custom property values, and math functions)
 * and copies everything else conservatively.
 */
export declare const minifyCss: (css: string) => string;
