import type { exmed, SaveOptions } from "../core/options";
import type { Shweet } from "../core/shweet";
/**
 * Compiles and writes the instance CSS and optional export maps. Filesystem
 * behavior, including the empty-CSS placeholder, matches the previous
 * `save` closure.
 */
export declare const saveShweet: <T extends exmed>(instance: Shweet<T>, mediaFeatures: T, exportMap: boolean | undefined, options?: SaveOptions) => Shweet<T>;
