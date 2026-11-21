/**
 * Shared design-kit fixture.
 *
 * This is the base Shweet of the a -> b -> c chain. It owns the design tokens
 * (custom properties), a small page shell, layout/component classes, responsive
 * and dark-mode values, and a keyframes animation. `test/b` imports this module
 * through `shweets`, so its declarations are composed with the `kit` prefix
 * intact.
 */
import { Shweet, Vars, med, ps } from "../../src";

/**
 * Media features are resolved by the instance that saves. Later fixtures spread
 * this object so imported `standalone` declarations still render.
 */
export const baseMediaFeatures = {
  standalone: "(display-mode: standalone)",
};

/** Shared custom properties, exported so composed fixtures can reference them. */
export const theme = Vars({
  ink: "#1f2933",
  surface: "#ffffff",
  accent: med("#2563eb", { dark: "#60a5fa" }),
  radius: "0.75rem",
});

const { c, d, i, kf, save } = new Shweet({
  __filename,
  prefix: "kit",
  exportMap: true,
  mediaFeature: baseMediaFeatures,
});

// Design tokens are declared once for the whole composed stylesheet.
d[":root"] = theme;

// Matching global page defaults.
d.body = {
  margin: "0",
  backgroundColor: theme.surface.__(),
  color: theme.ink.__(),
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

// Page shell written as an id rule. On installed PWAs the viewport-height unit
// is upgraded through the custom `standalone` media feature.
i.shell = {
  minHeight: med("100vh", { standalone: "100dvh" }),
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
};

// Vertical layout primitive with responsive spacing.
c.stack = [
  {
    display: "flex",
    flexDirection: "column",
    gap: med(1, { md: 1.5 }),
  },
  ps.child(".stack-item")({ minWidth: "0" }),
];

// Card component: tokens, responsive padding, a hover state, and nested parts.
c.card = [
  {
    backgroundColor: theme.surface.__(),
    border: "1px solid rgb(16 24 40 / 0.1)",
    borderRadius: theme.radius.__(),
    color: theme.ink.__(),
    padding: med(1, { md: 1.5 }),
    boxShadow: "0 1px 2px rgb(16 24 40 / 0.08)",
  },
  ps.hover()({
    boxShadow: "0 8px 24px rgb(16 24 40 / 0.14)",
  }),
  ps.child(".card-title")({
    margin: "0",
    color: theme.accent.__(),
    fontSize: med(1.125, { md: 1.25 }),
  }),
  ps.child(".card-body")({
    lineHeight: "1.6",
  }),
];

// Status badge with a looping keyframes animation. The animation name is
// prefixed to `kit_breathe` alongside the keyframes rule below.
c.badge = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.25rem 0.75rem",
  borderRadius: "999px",
  backgroundColor: theme.accent.__(),
  color: theme.surface.__(),
  fontSize: "0.875rem",
  animation: "breathe 3s ease-in-out infinite",
};

kf.breathe = {
  from: { opacity: 0.6 },
  "50%": { opacity: 1 },
  to: { opacity: 0.6 },
};

export default save({
  dir: __dirname,
  mapDir: __dirname,
  minify: false,
});
