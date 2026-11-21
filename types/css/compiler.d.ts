import { Mapped } from "../helpers";
import type { exmed } from "../core/options";
import type { Shweet } from "../core/shweet";
/**
 * Compatibility entry point for compiling a Shweet instance. It keeps the
 * public `CID`/`css`/`load` surface used by the root `save` method and deep
 * imports.
 */
export declare class Loader<T extends exmed = exmed> {
    shweet: Shweet<T>;
    shaker: string[];
    include: string[];
    CID: Mapped<string, Set<string>>;
    css: string;
    constructor(shweet: Shweet<T>, shaker?: string[], include?: string[]);
    load(exportMap?: boolean, mediaFeatures?: Record<string, unknown>): this;
}
