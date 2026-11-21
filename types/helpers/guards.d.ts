/**
 * Value-level number guard matching the migrated source's original behavior.
 * Unlike the utility package's strict `isNumber`, `NaN` is still a number here, which keeps
 * `Value` output unchanged for non-finite CSS values.
 */
export declare const isNumber: (value: unknown) => value is number;
/**
 * Numeric-key guard matching the original helper used for keyframe keys.
 * Accepts numeric strings such as `"50"` so `50` becomes `"50%"`.
 */
export declare const isNumeric: (value: unknown) => boolean;
export declare const isClassOrId: (key: string) => boolean;
