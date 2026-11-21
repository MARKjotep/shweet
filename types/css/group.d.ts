import type { StyleRule, StyleRulesByMedia, SupportsStyleRulesByMedia } from "./collect";
/**
 * A conservative group: one selector list whose adjacent source rules had the
 * exact same serialized declaration sequence in the same conditional context.
 */
export interface GroupedRule {
    selectors: Set<string>;
    declarations: string[];
}
export type GroupedRulesByMedia = Record<string, GroupedRule[]>;
export type GroupedSupportsByMedia = Record<string, Record<string, GroupedRule[]>>;
/**
 * Compatibility aliases for the previous grouped output shape.
 */
export type DeclarationsBySelectorList = Record<string, string[]>;
export type DeclarationsBySelectorListByMedia = Record<string, DeclarationsBySelectorList>;
export type SupportsRulesByMedia = Record<string, Record<string, Record<string, Set<string>>>>;
/**
 * Conservative default grouping: merge only adjacent rules whose complete
 * exact serialized declaration sequence matches. The ordered `Set` keeps the
 * first-seen selector order while removing duplicate selector expressions
 * inside an eligible group.
 *
 * Any intervening rule with a different declaration sequence ends the group,
 * so source order is preserved even when an earlier and a later selector share
 * declarations. This is what keeps the `.a { color: red } .b { color: blue }
 * .c { color: red }` cascade intact for `.b.c`.
 */
export declare const groupStyleRules: (rules: StyleRule[]) => GroupedRule[];
/**
 * Second grouping stage, now order-preserving: media buckets are pre-seeded in
 * the configured media order, then each bucket keeps source-rule order.
 */
export declare const groupDeclarations: (styleRulesByMedia: StyleRulesByMedia, mediaNames: string[]) => GroupedRulesByMedia;
/**
 * Groups supports rules per media and supports condition. Adjacent rules only
 * merge when their complete declaration sequences match, so movement across a
 * different supports declaration is never attempted.
 */
export declare const groupSupports: (supportsRulesByCondition: SupportsStyleRulesByMedia) => GroupedSupportsByMedia;
