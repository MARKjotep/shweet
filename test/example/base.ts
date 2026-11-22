/**
 * Shared base Shweet for the composed example.
 *
 * This module owns the shared design tokens expressed as classes, a couple of
 * media-conditioned declarations (including one custom media feature), and a
 * keyframes animation. `index.ts` imports this instance through `shweets`, so
 * its declarations and export-map entries are merged into the composed
 * stylesheet with the `base` prefix intact.
 */
import { Shweet, med } from "../../dist";

/**
 * Media features are resolved per compilation by the instance that saves.
 * A child instance therefore has to provide the same feature definitions when
 * it wants imported styles that use them to render. Exporting the object keeps
 * that requirement explicit and avoids duplicating the query text.
 */
export const baseMediaFeatures = {
  standalone: "(display-mode: standalone)",
};

export const base = new Shweet({
  __filename,
  name: "base",
  prefix: "base",
  exportMap: true,
  mediaFeature: baseMediaFeatures,
});

// First shared class. `index.ts` deliberately ends its local assignments with
// an identical declaration so the observed output shows the adjacency grouping
// rule working across the local/imported boundary.
base.c.brand = { color: "red" };

// Shared layout classes; `padding` and the breakpoint values use the base
// instance's unit/prefix configuration.
base.c.panel = { backgroundColor: "white", color: "black", padding: 1 };

base.c["panel-title"] = {
  fontSize: med(1, { md: 1.25 }),
  fontWeight: "bold",
};

// Mixes the default bucket, the shared `md` breakpoint, and the custom
// `standalone` media feature declared above.
base.c["panel-body"] = {
  display: med("block", { md: "flex", standalone: "grid" }),
};

base.kf.drift = {
  from: { transform: "translateX(0)" },
  to: { transform: "translateX(1rem)" },
};

// Animation names are prefixed with the declaring instance's prefix, so this
// becomes `base_drift` and resolves to the keyframes rule below.
base.c["drift-in"] = {
  animation: "drift 4s ease-in-out infinite alternate",
};
