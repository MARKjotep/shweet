/**
 * Page fixture.
 *
 * Imports the blog fixture (which in turn imports the shared kit) and adds the
 * final page layout, article typography, supports block, targeted media
 * features, and a local keyframes animation. The import chain keeps the `kit`
 * and `blog` prefixes intact while local styles use `page`.
 */
import { Shweet, med, ps, supports } from "../../src";
import blog, { blogMediaFeatures, theme } from "../b";

/**
 * Extend the inherited features with one local query. `standalone` (base) and
 * `wide` (blog) must stay defined here because this is the instance that saves.
 */
const pageMediaFeatures = {
  ...blogMediaFeatures,
  finePointer: "(pointer: fine)",
};

const { c, d, i, kf, save } = new Shweet({
  __filename,
  name: "i",
  prefix: "page",
  shweets: [blog],
  exportMap: true,
  mediaFeature: pageMediaFeatures,
});

// Page-level id rule.
i.main = {
  width: "100%",
  maxWidth: "72rem",
  marginInline: "auto",
  paddingInline: med(1, { md: 2 }),
};

// Two-column layout that falls back to a single column without grid support,
// then widens when an aside is present.
c.layout = [
  {
    display: "flex",
    flexDirection: "column",
    gap: med(1, { lg: 2 }),
  },
  supports({ display: "grid" })({
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
  }),
  ps.has("> .layout-aside")({
    gridTemplateColumns: "minmax(0, 1fr) 18rem",
  }),
];

c["layout-main"] = {
  minWidth: "0",
  padding: med("0", { md: 1, finePointer: 2 }),
  animation: "rise 500ms ease-out both",
};

c["layout-aside"] = {
  display: "grid",
  alignContent: "start",
  gap: 1,
  position: "sticky",
  top: "1rem",
};

// Article typography with a dark-mode size and nested parts.
c.article = [
  {
    fontSize: med(1, { md: 1.125, dark: 1 }),
    lineHeight: "1.7",
  },
  ps.child(".article-lead")({
    color: theme.accent.__(),
    fontSize: med(1.125, { md: 1.25 }),
  }),
  ps.child(".article-footnote")({
    fontSize: "0.875rem",
    opacity: 0.7,
  }),
  supports({ textWrap: "balance" })({
    textWrap: "balance",
  }),
];

// Global focus treatment using the shared accent token.
d[":focus-visible"] = {
  outline: `2px solid ${theme.accent.__()}`,
  outlineOffset: "2px",
};

kf.rise = {
  from: { opacity: 0, transform: "translateY(1rem)" },
  to: { opacity: 1, transform: "translateY(0)" },
};

export default save({
  dir: __dirname,
  mapDir: __dirname,
  mapName: "css",
  minify: false,
});
