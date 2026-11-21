/**
 * Value-level number guard matching the migrated source's original behavior.
 * Unlike the utility package's strict `isNumber`, `NaN` is still a number here, which keeps
 * `Value` output unchanged for non-finite CSS values.
 */
export const isNumber = (value: unknown): value is number =>
  typeof value === "number";

/**
 * Numeric-key guard matching the original helper used for keyframe keys.
 * Accepts numeric strings such as `"50"` so `50` becomes `"50%"`.
 */
export const isNumeric = (value: unknown): boolean => {
  const text = String(value);
  return !Number.isNaN(parseFloat(text)) && Number.isFinite(Number(value));
};

export const isClassOrId = (key: string): boolean =>
  key.startsWith(".") || key.startsWith("#");
