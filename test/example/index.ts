/**
 * Runnable composed-Shweet example.
 *
 * Run with: bun test/example/index.ts
 *
 * Two separate Shweet modules are combined here:
 *
 * - `base.ts` exports a configured Shweet with shared classes, breakpoint and
 *   custom-media declarations, and a keyframes animation.
 * - this entry point imports that instance through `shweets`, then adds its own
 *   id/class declarations, nested selectors, a supports() block, a local
 *   keyframes animation, and a local custom media feature.
 *
 * The example saves the merged CSS and export map into a temporary directory,
 * prints both plus the imported paths, asserts the observable merged content,
 * and removes the temporary directory again. No project fixture is read or
 * written.
 */
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Shweet, med, ps, supports } from "../../src";
import { base, baseMediaFeatures } from "./base";

const app = new Shweet({
  __filename,
  name: "composed",
  prefix: "app",
  exportMap: true,
  // Imported instances keep their own prefix, classes, and keyframes. Import
  // order is preserved, and imported style rules are collected after the local
  // rules of the receiving handler.
  shweets: [base],
  // Media features are resolved from the instance that saves, so repeat the
  // base feature definitions here, plus one local feature of our own.
  mediaFeature: {
    ...baseMediaFeatures,
    wide: "(min-width: 1440px)",
  },
});

// Class assignment syntax: `c` for classes, `d` for arbitrary selectors.
app.c.card = { color: "red", padding: 1 };
app.c["card-title"] = {
  fontSize: med(1.25, { md: 1.5 }),
  fontWeight: "bold",
};
app.d["#app"] = { display: "grid" };

// Nested selectors and conditional blocks can be combined in one array.
app.c.grid = [
  { display: "block" },
  ps.child(".cell")({ minHeight: 2 }),
  supports({ display: "grid" })({ display: "grid", grid: med(1, { lg: 3 }) }),
];

// Local keyframes and an animation declaration that references them. The
// animation name is prefixed with this instance's prefix (`app_pulse`).
app.kf.pulse = {
  from: { opacity: 1 },
  "50%": { opacity: 0.5 },
  to: { opacity: 1 },
};
app.c.pulse = { animation: "pulse 2s infinite" };

// Local classes can use both the imported base media features and a local one.
app.c.theme = {
  color: med("blue", { wide: "orange", standalone: "green" }),
};

// Last local declaration. Its exact sequence matches the imported base's first
// style rule, so Phase 2 adjacency grouping merges the two selectors even
// though they come from different source modules.
app.c["brand-local"] = { color: "red" };

const outputDirectory = mkdtempSync(join(tmpdir(), "shweet-example-"));

const assertIncludes = (text: string, expected: string, label: string) => {
  if (!text.includes(expected)) {
    throw new Error(`Example ${label} is missing: ${expected}`);
  }
};

try {
  app.save({
    dir: outputDirectory,
    mapDir: outputDirectory,
    minify: false,
  });

  const css = readFileSync(join(outputDirectory, "composed.css"), "utf8");
  const exportMap = readFileSync(join(outputDirectory, "index.js"), "utf8");

  console.log("--- imported paths ---");
  app.imported.forEach((path) => console.log(path));
  console.log("--- composed.css ---");
  console.log(css);
  console.log("--- index.js (export map) ---");
  console.log(exportMap);

  // Imported base content is present with its own prefix, next to local output.
  assertIncludes(css, ".base_panel", "CSS");
  assertIncludes(css, ".base_panel-title", "CSS");
  assertIncludes(css, ".app_card", "CSS");
  assertIncludes(css, ".app_grid > .app_cell", "CSS");

  // Keyframes from both modules are emitted, and animation references point at
  // the prefixed names of their declaring instance.
  assertIncludes(css, "@keyframes base_drift", "CSS");
  assertIncludes(css, "@keyframes app_pulse", "CSS");
  assertIncludes(css, ".base_drift-in {", "CSS");
  assertIncludes(css, "animation: base_drift 4s", "CSS");
  assertIncludes(css, ".app_pulse {", "CSS");
  assertIncludes(css, "animation: app_pulse 2s", "CSS");

  // Default, shared breakpoint, imported feature, and local feature output.
  assertIncludes(css, "@media (min-width: 768px)", "CSS");
  assertIncludes(css, "@media (display-mode: standalone)", "CSS");
  assertIncludes(css, "@media (min-width: 1440px)", "CSS");
  assertIncludes(css, "@supports(display:grid)", "CSS");

  // Observed adjacency merge across the local/imported boundary: the last local
  // declaration precedes the imported base's first declaration and both have
  // the exact same declaration sequence.
  assertIncludes(css, ".app_brand-local, .base_brand {", "CSS");
  if (css.includes(".app_theme, .app_brand-local")) {
    throw new Error(
      "Example adjacency merge unexpectedly pulled in the non-adjacent theme rule",
    );
  }

  // Export-map keys stay unprefixed, while values carry the declaring prefix.
  assertIncludes(exportMap, 'card="app_card"', "export map");
  assertIncludes(exportMap, 'panel="base_panel"', "export map");
  assertIncludes(exportMap, 'drift_in="base_drift-in"', "export map");
  assertIncludes(exportMap, 'brand_local="app_brand-local"', "export map");
  assertIncludes(exportMap, 'brand="base_brand"', "export map");

  if (app.imported.length !== 1 || app.imported[0] !== base.path) {
    throw new Error("Example imported paths do not match the base instance");
  }

  console.log("Example assertions passed.");
} finally {
  rmSync(outputDirectory, { recursive: true, force: true });
}
