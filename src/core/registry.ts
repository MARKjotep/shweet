import { At, Cid, FontFace, Keyframes } from "../css/selectors";
import type { Base } from "../css/selectors/base";

export type SelectorHandler = Cid | Keyframes | At | FontFace;

export type SelectorHandlers = Record<string, SelectorHandler>;

interface ImportedShweet {
  path: string;
  imported: string[];
  [key: string]: unknown;
}

/**
 * Creates the Proxy-backed selector handlers in the historical assignment
 * order. The order is significant because compilation walks
 * `Object.values(shweet)`.
 */
export const createSelectorHandlers = (
  prefix: string,
  webkitKeyframes: boolean = false,
  exportMap?: boolean,
  unit?: string,
  source: string = "",
): SelectorHandlers => ({
  d: new Cid("", prefix, exportMap, unit, source),
  i: new Cid("#", prefix, exportMap, unit, source),
  c: new Cid(".", prefix, exportMap, unit, source),
  kf: new Keyframes(prefix, webkitKeyframes, unit, source),
  at: new At("", source),
  font: new FontFace("", source),
});

/**
 * Removes repeated references to the same imported Shweet object while keeping
 * first-seen order. Identity is the Shweet object itself, so two distinct
 * instances that share a source path are both retained.
 */
const dedupeImports = (imports: ImportedShweet[]): ImportedShweet[] => {
  const seen = new Set<ImportedShweet>();

  return imports.filter((loadedShweet) => {
    if (seen.has(loadedShweet)) return false;
    seen.add(loadedShweet);
    return true;
  });
};

/**
 * Imports handler data from other Shweet instances without replacing the
 * receiving handler.
 */
export const loadSelectorHandlers = (
  handlers: SelectorHandlers,
  imports: ImportedShweet[],
  importedPaths: Set<string>,
): SelectorHandlers => {
  dedupeImports(imports).forEach((loadedShweet) => {
    importedPaths.add(loadedShweet.path);
    loadedShweet.imported.forEach((importedPath) => {
      importedPaths.add(importedPath);
    });

    Object.keys(handlers).forEach((propertyKey) => {
      handlers[propertyKey]!.load(loadedShweet[propertyKey] as Base);
    });
  });

  return handlers;
};

/**
 * Converts each populated handler into its Proxy facade for instance
 * assignment.
 */
export const toProxyHandlers = (
  handlers: SelectorHandlers,
): Record<string, unknown> => {
  const proxies: Record<string, unknown> = {};

  Object.keys(handlers).forEach((propertyKey) => {
    proxies[propertyKey] = handlers[propertyKey]!.css;
  });

  return proxies;
};
