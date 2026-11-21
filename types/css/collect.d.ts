import { Mapped } from "@ohmyqt/u";
import type { DiagnosticHandler, exmed } from "../core/options";
import type { Shweet } from "../core/shweet";
/**
 * One style rule in source (selector assignment) order. `selector` is kept as
 * one intact selector expression; `declarations` is the exact serialized
 * declaration sequence for one media bucket.
 */
export interface StyleRule {
    selector: string;
    declarations: string[];
}
export type StyleRulesByMedia = Record<string, StyleRule[]>;
/** Supports rules keyed by supports condition, then by media name. */
export type SupportsStyleRulesByMedia = Record<string, StyleRulesByMedia>;
/**
 * Compatibility aliases for the previous declaration-inverted collection
 * shape. The compiler no longer inverts declarations before grouping, but deep
 * type imports keep resolving.
 */
export type SelectorsByDeclaration = Record<string, string[]>;
export type SelectorsByDeclarationByMedia = Record<string, SelectorsByDeclaration>;
export type SupportsByMedia = Record<string, SelectorsByDeclarationByMedia>;
/** Keyframe rule text grouped by media and keyframe at-rule. */
export type KeyframeBlocksByMedia = Record<string, Record<string, string[]>>;
export interface CollectOptions {
    shaker: string[];
    include: string[];
    exportMap?: boolean | undefined;
    cid: Mapped<string, Set<string>>;
    /** Root source path, used only when a handler has no path of its own. */
    sourcePath?: string | undefined;
    /** Optional structured diagnostic sink. */
    onDiagnostic?: DiagnosticHandler | undefined;
}
export interface CollectedCss {
    /** Ordered style rules per media bucket, before conservative grouping. */
    styleRulesByMedia: StyleRulesByMedia;
    /** Ordered supports rules per condition and media bucket. */
    supportsRulesByCondition: SupportsStyleRulesByMedia;
    keyframeBlocksByMedia: KeyframeBlocksByMedia;
    atRules: Set<string>;
}
export declare const collectCss: <T extends exmed>(shweet: Shweet<T>, options: CollectOptions) => CollectedCss;
