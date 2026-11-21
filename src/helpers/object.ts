import type { Mapped } from "@ohmyqt/u";
import { isArray, isNull, isObject } from "@ohmyqt/u";

/**
 * Merges properties into the object stored at `key`, creating the entry first
 * when it is missing. This preserves the mutation behavior of the legacy
 * `Mapper.ass` helper rather than replacing the stored value.
 */
export const mergeProperties = <K, V>(
  map: Mapped<K, V>,
  key: K,
  value: object,
): void => {
  if (!map.has(key)) {
    map.set(key, {} as V);
  }

  Object.assign(map.get(key) as object, value);
};

export type ObjectChanges = {
  added: Record<string, unknown>;
  removed: Record<string, unknown>;
  modified: Record<string, { old: unknown; new: unknown }>;
};

export const compareObjects = (
  oldObject: object,
  newObject: object,
): ObjectChanges => {
  const changes: ObjectChanges = { added: {}, removed: {}, modified: {} };
  const oldRecord = oldObject as Record<string, unknown>;
  const newRecord = newObject as Record<string, unknown>;

  for (const key of Object.keys(newRecord)) {
    const oldValue = oldRecord[key];
    const newValue = newRecord[key];

    if (!Object.hasOwn(oldRecord, key)) {
      changes.added[key] = newValue;
    } else if (isArray(oldValue) && isArray(newValue)) {
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.modified[key] = { old: oldValue, new: newValue };
      }
    } else if (
      isObject(oldValue) &&
      isObject(newValue) &&
      !isNull(oldValue) &&
      !isNull(newValue)
    ) {
      const nested = compareObjects(oldValue, newValue);
      if (hasObjectChanges(nested)) {
        changes.modified[key] = { old: oldValue, new: newValue };
      }
    } else if (oldValue !== newValue) {
      changes.modified[key] = { old: oldValue, new: newValue };
    }
  }

  for (const key of Object.keys(oldRecord)) {
    if (!Object.hasOwn(newRecord, key)) {
      changes.removed[key] = oldRecord[key];
    }
  }

  return changes;
};

export const hasObjectChanges = (changes: ObjectChanges): boolean =>
  Object.values(changes).some((group) => Object.keys(group).length > 0);
