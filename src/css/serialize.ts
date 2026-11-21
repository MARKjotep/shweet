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

/**
 * Renders the collected rule groups. Order matches the previous loader:
 * at-rules first, then each media bucket with animation/transition rules moved
 * to the front, followed by keyframes and supports blocks.
 *
 * Group order inside a bucket is source order; only adjacent compatible rules
 * were merged, so moving an animation group to the front is the only remaining
 * reordering step.
 */
export const serializeCss = (
  input: SerializeInput,
  mediaProperties: Record<string, unknown>,
  defaultMedia: string,
): string => {
  const blocks = new Set<string>();

  input.atRules.forEach((atRule) => {
    blocks.add(atRule);
  });

  Object.entries(input.groupedRulesByMedia).forEach(
    ([mediaName, groupedRules]) => {
      const rules: string[] = [];
      const animationRules: string[] = [];

      groupedRules.forEach(({ selectors, declarations }) => {
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
