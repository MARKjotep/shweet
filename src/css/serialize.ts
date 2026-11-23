import type { KeyframeBlocksByMedia } from "./collect";
import type {
  GroupedRule,
  GroupedRulesByMedia,
  GroupedSupportsByMedia,
} from "./group";

export interface SerializeInput {
  /** Source-ordered conservative rule groups per media bucket. */
  groupedRulesByMedia: GroupedRulesByMedia;
  /** Source-ordered supports rule groups per media bucket and condition. */
  groupedSupportsByMedia: GroupedSupportsByMedia;
  keyframeBlocksByMedia: KeyframeBlocksByMedia;
  atRules: Set<string>;
}

export const toProperty = (sel: string, vals: string[]) => {
  return `${sel} {\n  ${vals.join(" \n  ")}\n}`;
};

const serializeSelectorList = (selectors: Set<string>) =>
  [...selectors].join(", ");

/** A rule is hoisted when any declaration animates or transitions. */
const isAnimationOrTransitionRule = (declarations: string[]) =>
  declarations.some(
    (declaration) =>
      declaration.startsWith("animation") ||
      declaration.startsWith("transition"),
  );

const serializeRule = (selectors: Set<string>, declarations: string[]) =>
  toProperty(serializeSelectorList(selectors), declarations);

/** True only for a group whose selector set is exactly `:root`. */
const isRootOnlyGroup = ({ selectors }: GroupedRule) =>
  selectors.size === 1 && selectors.has(":root");

/**
 * Folds same-selector `:root` groups within one media bucket into the first
 * such group, concatenating declarations in source order. The cascade result is
 * unchanged because duplicate custom properties keep their order and later
 * declarations still win. No other selector is ever combined.
 */
const mergeRootGroups = (groupedRules: GroupedRule[]): GroupedRule[] => {
  let rootGroup: GroupedRule | undefined;
  const merged: GroupedRule[] = [];

  groupedRules.forEach((group) => {
    if (!isRootOnlyGroup(group)) {
      merged.push(group);
      return;
    }

    if (rootGroup) {
      rootGroup.declarations.push(...group.declarations);
      return;
    }

    rootGroup = {
      selectors: new Set(group.selectors),
      declarations: [...group.declarations],
    };
    merged.push(rootGroup);
  });

  return merged;
};

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
export const serializeCss = (
  input: SerializeInput,
  mediaProperties: Record<string, unknown>,
  defaultMedia: string,
  mergeRoot: boolean = false,
): string => {
  const blocks = new Set<string>();

  input.atRules.forEach((atRule) => {
    blocks.add(atRule);
  });

  Object.entries(input.groupedRulesByMedia).forEach(
    ([mediaName, groupedRules]) => {
      const sourceRules = mergeRoot
        ? mergeRootGroups(groupedRules)
        : groupedRules;
      const rules: string[] = [];
      const animationRules: string[] = [];

      sourceRules.forEach(({ selectors, declarations }) => {
        const rule = serializeRule(selectors, declarations);

        if (isAnimationOrTransitionRule(declarations)) {
          animationRules.push(rule);
        } else {
          rules.push(rule);
        }
      });

      if (animationRules.length) {
        rules.unshift(...animationRules);
      }

      const keyframeRules = input.keyframeBlocksByMedia[mediaName];
      if (keyframeRules) {
        Object.entries(keyframeRules).forEach(([keyframeRule, declarations]) => {
          rules.push(toProperty(keyframeRule, declarations));
        });
      }

      const supportsRules = input.groupedSupportsByMedia[mediaName];
      if (supportsRules) {
        Object.entries(supportsRules).forEach(
          ([supportsRule, groupedSupportRules]) => {
            const supportRuleBlocks = groupedSupportRules.map(
              ({ selectors, declarations }) =>
                serializeRule(selectors, declarations),
            );

            rules.push(toProperty(supportsRule, supportRuleBlocks));
          },
        );
      }

      if (rules.length) {
        if (mediaName === defaultMedia) {
          blocks.add(`/* -------------- ${mediaName} ( default ) */`);
          blocks.add(rules.join("\n"));
        } else {
          const mediaQuery = mediaName
            .split("-")
            .map((part) => mediaProperties[part])
            .join(" and ");

          if (mediaQuery) {
            blocks.add(`/* -------------- ${mediaName} */`);
            blocks.add(`@media ${mediaQuery}\t{\n${rules.join("\n")}\n}`);
          }
        }
      }
    },
  );

  return [...blocks].join("\n");
};
