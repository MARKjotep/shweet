import type {
  StyleRule,
  StyleRulesByMedia,
  SupportsStyleRulesByMedia,
} from "./collect";

/**
 * A conservative group: one selector list whose adjacent source rules had the
 * exact same serialized declaration sequence in the same conditional context.
 */
export interface GroupedRule {
  selectors: Set<string>;
  declarations: string[];
}

export type GroupedRulesByMedia = Record<string, GroupedRule[]>;
export type GroupedSupportsByMedia = Record<
  string,
  Record<string, GroupedRule[]>
>;

/**
 * Compatibility aliases for the previous grouped output shape.
 */
export type DeclarationsBySelectorList = Record<string, string[]>;
export type DeclarationsBySelectorListByMedia = Record<
  string,
  DeclarationsBySelectorList
>;
export type SupportsRulesByMedia = Record<
  string,
  Record<string, Record<string, Set<string>>>
>;

const sameDeclarationSequence = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;

  return a.every((declaration, index) => declaration === b[index]);
};

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
export const groupStyleRules = (rules: StyleRule[]): GroupedRule[] => {
  const grouped: GroupedRule[] = [];

  for (const rule of rules) {
    const previous = grouped[grouped.length - 1];

    if (
      previous &&
      sameDeclarationSequence(previous.declarations, rule.declarations)
    ) {
      previous.selectors.add(rule.selector);
    } else {
      grouped.push({
        selectors: new Set([rule.selector]),
        declarations: [...rule.declarations],
      });
    }
  }

  return grouped;
};

/**
 * Second grouping stage, now order-preserving: media buckets are pre-seeded in
 * the configured media order, then each bucket keeps source-rule order.
 */
export const groupDeclarations = (
  styleRulesByMedia: StyleRulesByMedia,
  mediaNames: string[],
): GroupedRulesByMedia => {
  const groupedRulesByMedia: GroupedRulesByMedia = {};

  mediaNames.forEach((mediaName) => {
    groupedRulesByMedia[mediaName] ??= [];
  });

  Object.entries(styleRulesByMedia).forEach(([mediaName, rules]) => {
    (groupedRulesByMedia[mediaName] ??= []).push(...groupStyleRules(rules));
  });

  return groupedRulesByMedia;
};

/**
 * Groups supports rules per media and supports condition. Adjacent rules only
 * merge when their complete declaration sequences match, so movement across a
 * different supports declaration is never attempted.
 */
export const groupSupports = (
  supportsRulesByCondition: SupportsStyleRulesByMedia,
): GroupedSupportsByMedia => {
  const grouped: GroupedSupportsByMedia = {};

  Object.entries(supportsRulesByCondition).forEach(
    ([supportCondition, rulesByMedia]) => {
      const supportsRule = `@supports(${supportCondition})`;

      Object.entries(rulesByMedia).forEach(([mediaName, rules]) => {
        const rulesForMedia = (grouped[mediaName] ??= {});
        (rulesForMedia[supportsRule] ??= []).push(...groupStyleRules(rules));
      });
    },
  );

  return grouped;
};
