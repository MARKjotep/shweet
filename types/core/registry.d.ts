import { At, Cid, FontFace, Keyframes } from "../css/selectors";
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
export declare const createSelectorHandlers: (prefix: string, webkitKeyframes?: boolean, exportMap?: boolean, unit?: string, source?: string) => SelectorHandlers;
/**
 * Imports handler data from other Shweet instances without replacing the
 * receiving handler.
 */
export declare const loadSelectorHandlers: (handlers: SelectorHandlers, imports: ImportedShweet[], importedPaths: Set<string>) => SelectorHandlers;
/**
 * Converts each populated handler into its Proxy facade for instance
 * assignment.
 */
export declare const toProxyHandlers: (handlers: SelectorHandlers) => Record<string, unknown>;
export {};
