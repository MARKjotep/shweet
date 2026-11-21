import type { Mapped } from "@ohmyqt/u";
/**
 * Merges properties into the object stored at `key`, creating the entry first
 * when it is missing. This preserves the mutation behavior of the legacy
 * `Mapper.ass` helper rather than replacing the stored value.
 */
export declare const mergeProperties: <K, V>(map: Mapped<K, V>, key: K, value: object) => void;
export type ObjectChanges = {
    added: Record<string, unknown>;
    removed: Record<string, unknown>;
    modified: Record<string, {
        old: unknown;
        new: unknown;
    }>;
};
export declare const compareObjects: (oldObject: object, newObject: object) => ObjectChanges;
export declare const hasObjectChanges: (changes: ObjectChanges) => boolean;
