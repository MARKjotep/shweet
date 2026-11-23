import type { KeyframeBlocksByMedia } from "./collect";
import type { GroupedRulesByMedia, GroupedSupportsByMedia } from "./group";
export interface SerializeInput {
    /** Source-ordered conservative rule groups per media bucket. */
    groupedRulesByMedia: GroupedRulesByMedia;
    /** Source-ordered supports rule groups per media bucket and condition. */
    groupedSupportsByMedia: GroupedSupportsByMedia;
    keyframeBlocksByMedia: KeyframeBlocksByMedia;
    atRules: Set<string>;
}
export declare const toProperty: (sel: string, vals: string[]) => string;
/**
 * Renders the collected rule groups. Order matches the previous loader:
 * at-rules first, then each media bucket with animation/transition rules moved
 * to the front, followed by keyframes and supports blocks.
 *
 * Group order inside a bucket is source order; only adjacent compatible rules
 * were merged, so moving an animation group to the front is the only remaining
 * reordering step. When `mergeRoot` is enabled, same-selector `:root` groups are
 * folded into one block per bucket before serialization.
 */
export declare const serializeCss: (input: SerializeInput, mediaProperties: Record<string, unknown>, defaultMedia: string, mergeRoot?: boolean) => string;
