/**
 * Blog fixture.
 *
 * Imports the shared kit from `test/a` and adds post components with the `blog`
 * prefix. The exported media features repeat the base's custom feature so the
 * imported `standalone` declarations resolve when this module saves.
 */
import { Shweet, med, ps, supports } from "../../src";
import base, { baseMediaFeatures, theme } from "../a";

export { theme } from "../a";

export const blogMediaFeatures = {
  ...baseMediaFeatures,
  wide: "(min-width: 1200px)",
};

const { c, kf, save } = new Shweet({
  __filename,
  prefix: "blog",
  shweets: [base],
  exportMap: true,
  mediaFeature: blogMediaFeatures,
});

c.post = [
  {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    padding: med(1.25, { md: 2, wide: 2.5 }),
    borderInlineStart: `0.25rem solid ${theme.accent.__()}`,
    backgroundColor: theme.surface.__(),
    color: theme.ink.__(),
  },
  ps.child(".post-title")({
    margin: "0",
    fontSize: med(1.5, { md: 2 }),
  }),
  ps.child(".post-meta")({
    color: theme.ink.__(),
    opacity: 0.72,
    fontSize: "0.875rem",
  }),
  ps.withClass(".is-featured")({
    backgroundColor: "#f8fafc",
  }),
  // Progressive enhancement: lay the post out as a grid where supported.
  supports({ display: "grid" })({
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "start",
  }),
];

c["post-cover"] = {
  width: "100%",
  aspectRatio: "16 / 9",
  objectFit: "cover",
  borderRadius: "0.5rem",
};

// Entrance animation declared locally by this fixture.
c["post-enter"] = {
  animation: "slide-in 600ms ease-out both",
};

kf["slide-in"] = {
  from: { opacity: 0, transform: "translateY(0.5rem)" },
  to: { opacity: 1, transform: "translateY(0)" },
};

export default save({
  dir: __dirname,
  mapDir: __dirname,
  minify: false,
});
