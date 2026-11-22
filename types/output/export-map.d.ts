import type { Mapped } from "@ohmyqt/u";
/**
 * Serializes a class/id export map. Keys are sorted by their rendered entry so
 * generated maps stay stable across insertion order.
 *
 * Ordinary class/id names keep the historical `export const name="value"`
 * form. Names that cannot be declared as bindings (reserved words,
 * digit-leading names, or names containing punctuation) are written through a
 * collision-safe local binding and a string-named export alias, which keeps
 * the generated module parseable while preserving the exact consumer key.
 */
export declare const serializeExportMap: (cids: Mapped<string, Set<string>>) => string;
export declare const writeExportMap: (filePath: string, cids: Mapped<string, Set<string>>) => void;
