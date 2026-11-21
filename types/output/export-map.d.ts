import type { Mapped } from "@ohmyqt/u";
/**
 * Serializes a class/id export map. Keys are sorted by their rendered entry so
 * generated maps stay stable across insertion order.
 */
export declare const serializeExportMap: (cids: Mapped<string, Set<string>>) => string;
export declare const writeExportMap: (filePath: string, cids: Mapped<string, Set<string>>) => void;
