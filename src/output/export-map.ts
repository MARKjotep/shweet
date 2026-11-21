import { writeFileSync } from "node:fs";
import type { Mapped } from "../helpers";

/**
 * Serializes a class/id export map. Keys are sorted by their rendered entry so
 * generated maps stay stable across insertion order.
 */
export const serializeExportMap = (
  cids: Mapped<string, Set<string>>,
): string => {
  const exportEntries = [...cids.entries()]
    .map(([key, value]) => {
      return `${key}="${[...value].join(" ")}"`;
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return exportEntries.length
    ? `export const ${exportEntries.join()};`
    : "export {}";
};

export const writeExportMap = (
  filePath: string,
  cids: Mapped<string, Set<string>>,
): void => {
  writeFileSync(filePath, serializeExportMap(cids));
};
