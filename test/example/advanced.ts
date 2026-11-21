/**
 * Advanced runnable example: composition, conditions, keyframes, string
 * declarations, and minified saving.
 *
 * Run with: bun test/example/advanced.ts
 *
 * `createAdvancedExample` is side-effect free so the integration test can
 * compile exactly the same instances without touching the filesystem. The CLI
 * entry point saves into a temporary directory, prints the artifacts, verifies
 * them, and removes the directory again.
 */
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  Medyas,
  Shweet,
  f,
  med,
  ps,
  supports,
  type MedyasOptions,
} from "../../src";

interface SurfaceData {
  tone: "plain" | "dark";
}

/**
 * Reusable presets are `Medyas` subclasses: each getter writes declarations
 * through `_value` and returns `this`, so media accessors such as `.MD` can be
 * inserted between getters to scope only the declarations that follow.
 */
class Surface extends Medyas<Surface, SurfaceData> {
  constructor(options: MedyasOptions<SurfaceData> = {}) {
    super({ data: { tone: "plain" }, ...options });
  }

  get card() {
    const dark = this.data.tone === "dark";
    this._value = {
      display: "block",
      padding: 2,
      borderRadius: 0.5,
      backgroundColor: dark ? "black" : "white",
      color: dark ? "white" : "black",
    };
    return this;
  }

  get compact() {
    this._value = { padding: 1 };
    return this;
  }

  get outlined() {
    this._value = { border: "1px solid currentColor" };
    return this;
  }
}

/**
 * Media features are resolved by the instance that saves. Both instances need
 * the imported features, and the composed instance adds one local feature.
 */
export const advancedMediaFeatures = {
  compact: "(max-width: 599px)",
  motion: "(prefers-reduced-motion: reduce)",
  hover: "(hover: hover)",
};

const baseMediaFeatures = {
  compact: advancedMediaFeatures.compact,
  motion: advancedMediaFeatures.motion,
};

const createBase = () => {
  const base = new Shweet({
    __filename,
    name: "advanced-base",
    prefix: "base",
    // The active compilation request decides whether a map is emitted, not
    // this creation-time flag. The composed instance below enables it.
    exportMap: false,
    mediaFeature: baseMediaFeatures,
  });

  // The handlers are Proxy-backed; destructuring keeps the assignments terse
  // while the instance stays available for saving and composition.
  const { c, kf } = base;

  c.tile = { padding: 1, backgroundColor: "black" };
  c.badge = {
    color: med("black", { compact: "white", motion: "gray" }),
  };

  // Keyframes are prefixed by their declaring instance: this becomes
  // `base_fade`, and `fade-in` references that prefixed name.
  kf.fade = {
    from: { opacity: 0 },
    to: { opacity: 1 },
  };
  c["fade-in"] = { animation: "fade 1s ease-out both" };

  return base;
};

export const createAdvancedExample = () => {
  const base = createBase();

  const app = new Shweet({
    __filename,
    name: "advanced",
    prefix: "adv",
    exportMap: true,
    // Importing through `shweets` keeps the base prefix and rule source order.
    shweets: [base],
    mediaFeature: advancedMediaFeatures,
  });

  // Destructured handlers keep the rule assignments terse; `app` still owns
  // saving, imported-path inspection, and the composed options.
  const { c, kf } = app;

  // Nested selectors, value builders, and a supports() block in one assignment.
  // `ps` returns ordinary nested keys, so prefixing keeps the local `adv_`
  // prefix on the parent and on every class named inside the selector.
  c.panel = [
    {
      display: "block",
      padding: 2,
      width: f.calc("100% -", 2),
      gap: f.clamp(1, 2, 3),
      backgroundImage: f.linearGradient("to right", "red", "blue"),
      color: f.var("brandColor", "red"),
    },
    // Child and descendant combinators; each is appended to `.adv_panel`.
    ps.child(".panel-title")({ fontSize: 1.5, fontWeight: "bold" }),
    ps.desc(".panel-body")({ color: "gray" }),
    ps.next(".panel-step")({ marginTop: 0 }),
    ps.general(".panel-note")({ opacity: 0.75 }),
    // Pseudo-classes, functional pseudo-classes, and focused variants.
    ps.hover()({ backgroundColor: "white" }),
    ps.focusVisible()({ outline: "2px solid" }),
    ps.is(".panel-title, .panel-body")({ marginBlock: 0 }),
    ps.not(".panel-disabled")({ cursor: "pointer" }),
    ps.has(".panel-icon")({ borderColor: "currentColor" }),
    // Attribute helpers append an attribute selector. Only the first entry of
    // the input object is used (see `ps.attr`).
    ps.attr({ "data-state": "open" })({ display: "grid" }),
    supports({ display: "grid" })({
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    }),
  ];

  // A reusable `Medyas` subclass keeps preset style out of the instance map.
  // `.MD` scopes only the following `compact` declarations, so the card keeps
  // its xs base declarations and gains the md padding override.
  c.surface = new Surface().card.MD.compact;
  c["surface-inverse"] = new Surface({ data: { tone: "dark" } }).card.outlined;

  // Local declarations use imported features (`compact`/`motion`) and a local
  // feature (`hover`) supplied by the composed instance.
  c.notice = {
    display: med("block", { compact: "flex", hover: "grid" }),
    color: med("navy", { motion: "black" }),
  };

  // A local keyframes animation. Prefixing produces `adv_slide`.
  kf.slide = {
    from: { transform: "translateX(-1rem)" },
    to: { transform: "translateX(0)" },
  };
  c["slide-in"] = {
    animation: "slide 600ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
  };

  // String declarations split only on top-level separators. Quoted values,
  // url payloads, and function arguments keep their `;`, `:`, and `,` content.
  c.caption =
    'fontFamily: "Iowan Old Style", "Palatino Linotype", serif; ' +
    'background: url("data:image/svg+xml;utf8,<svg></svg>"); ' +
    "gridTemplateColumns: repeat(2, minmax(0, 1fr)); " +
    "opacity: 0.8; " +
    "zIndex: 2";

  return { base, app };
};

const assertIncludes = (text: string, expected: string, label: string) => {
  if (!text.includes(expected)) {
    throw new Error(`Advanced example ${label} is missing: ${expected}`);
  }
};

export const runAdvancedExample = () => {
  const { base, app } = createAdvancedExample();
  const outputDirectory = mkdtempSync(join(tmpdir(), "shweet-advanced-"));

  try {
    // Save an expanded copy for inspection and a minified copy to verify that
    // protected strings, urls, and functions survive minification.
    app.save({ dir: outputDirectory, mapDir: outputDirectory, minify: false });
    app.save({ dir: outputDirectory, name: "advanced.min", minify: true });

    const css = readFileSync(join(outputDirectory, "advanced.css"), "utf8");
    const minified = readFileSync(
      join(outputDirectory, "advanced.min.css"),
      "utf8",
    );
    const exportMap = readFileSync(join(outputDirectory, "index.js"), "utf8");

    console.log("--- imported paths ---");
    app.imported.forEach((path) => console.log(path));
    console.log("--- advanced.css ---");
    console.log(css);
    console.log("--- advanced.min.css ---");
    console.log(minified);
    console.log("--- index.js (export map) ---");
    console.log(exportMap);

    // Both instances keep their own prefix in the composed stylesheet.
    assertIncludes(css, ".base_tile {", "CSS");
    assertIncludes(css, ".adv_panel {", "CSS");
    assertIncludes(css, ".adv_panel > .adv_panel-title {", "CSS");
    assertIncludes(css, ".adv_panel .adv_panel-body {", "CSS");
    assertIncludes(css, ".adv_panel + .adv_panel-step {", "CSS");
    assertIncludes(css, ".adv_panel ~ .adv_panel-note {", "CSS");
    assertIncludes(css, ".adv_panel:hover {", "CSS");
    assertIncludes(css, ".adv_panel:focus-visible {", "CSS");
    assertIncludes(
      css,
      ".adv_panel:is(.adv_panel-title, .adv_panel-body) {",
      "CSS",
    );
    assertIncludes(css, ".adv_panel:not(.adv_panel-disabled) {", "CSS");
    assertIncludes(css, ".adv_panel:has(.adv_panel-icon) {", "CSS");
    assertIncludes(css, '.adv_panel[data-state="open"] {', "CSS");
    assertIncludes(css, ".base_badge {", "CSS");
    assertIncludes(css, ".adv_notice {", "CSS");

    // A `Medyas` subclass preset keeps its xs card declarations and gains an
    // md padding override from the chained `.MD.compact` accessors.
    assertIncludes(css, ".adv_surface {", "CSS");
    assertIncludes(css, ".adv_surface-inverse {", "CSS");
    assertIncludes(css, "border: 1px solid currentColor;", "CSS");
    assertIncludes(css, "@media (min-width: 768px)", "CSS");

    // Value builders stay intact in normal declarations.
    assertIncludes(css, "width: calc(100% - 2rem);", "CSS");
    assertIncludes(css, "gap: clamp(1rem, 2rem, 3rem);", "CSS");
    assertIncludes(
      css,
      "background-image: linear-gradient(to right, red, blue);",
      "CSS",
    );
    assertIncludes(css, "color: var(--brand-color, red);", "CSS");

    // Imported/custom media features and a supports condition.
    assertIncludes(css, "@media (max-width: 599px)", "CSS");
    assertIncludes(css, "@media (prefers-reduced-motion: reduce)", "CSS");
    assertIncludes(css, "@media (hover: hover)", "CSS");
    assertIncludes(css, "@supports(display:grid) {", "CSS");

    // Imported and local keyframes are emitted, and the animation declarations
    // point at the prefixed names owned by each declaring instance.
    assertIncludes(css, "@keyframes base_fade {", "CSS");
    assertIncludes(css, "@keyframes adv_slide {", "CSS");
    assertIncludes(css, "animation: base_fade 1s ease-out both;", "CSS");
    assertIncludes(
      css,
      "animation: adv_slide 600ms cubic-bezier(0.2, 0.8, 0.2, 1) both;",
      "CSS",
    );

    // The declaration string preserved quoted separators and function content.
    assertIncludes(
      css,
      'font-family: "Iowan Old Style", "Palatino Linotype", serif;',
      "CSS",
    );
    assertIncludes(
      css,
      'background: url("data:image/svg+xml;utf8,<svg></svg>");',
      "CSS",
    );
    assertIncludes(
      css,
      "grid-template-columns: repeat(2, minmax(0, 1fr));",
      "CSS",
    );
    assertIncludes(css, "opacity: 0.8;", "CSS");
    assertIncludes(css, "z-index: 2;", "CSS");

    // The active map request includes imported and local selectors even though
    // the base instance opted out of its own map.
    assertIncludes(exportMap, 'tile="base_tile"', "export map");
    assertIncludes(exportMap, 'fade_in="base_fade-in"', "export map");
    assertIncludes(exportMap, 'panel="adv_panel"', "export map");
    assertIncludes(exportMap, 'surface="adv_surface"', "export map");
    assertIncludes(exportMap, 'surface_inverse="adv_surface-inverse"', "export map");
    assertIncludes(exportMap, 'caption="adv_caption"', "export map");

    // Minified output has no formatting newlines and keeps protected tokens.
    if (minified.includes("\n")) {
      throw new Error("Advanced example minified CSS contains a newline");
    }
    assertIncludes(minified, ".adv_slide-in{", "minified CSS");
    assertIncludes(minified, '.adv_panel[data-state="open"]{', "minified CSS");
    assertIncludes(
      minified,
      ".adv_panel:is(.adv_panel-title,.adv_panel-body){",
      "minified CSS",
    );
    assertIncludes(minified, "width:calc(100% - 2rem);", "minified CSS");
    assertIncludes(minified, "gap:clamp(1rem,2rem,3rem);", "minified CSS");
    assertIncludes(
      minified,
      "background-image:linear-gradient(to right,red,blue);",
      "minified CSS",
    );
    assertIncludes(minified, "color:var(--brand-color,red);", "minified CSS");
    assertIncludes(
      minified,
      'url("data:image/svg+xml;utf8,<svg></svg>")',
      "minified CSS",
    );
    assertIncludes(
      minified,
      "grid-template-columns:repeat(2,minmax(0,1fr));",
      "minified CSS",
    );
    assertIncludes(minified, "opacity:0.8;", "minified CSS");
    assertIncludes(
      minified,
      ".adv_surface{display:block;padding:2rem;border-radius:0.5rem;" +
        "background-color:white;color:black;}",
      "minified CSS",
    );
    assertIncludes(
      minified,
      "@media (min-width:768px){.adv_surface{padding:1rem;}}",
      "minified CSS",
    );
    assertIncludes(
      minified,
      ".adv_surface-inverse{display:block;padding:2rem;" +
        "border-radius:0.5rem;background-color:black;color:white;" +
        "border:1px solid currentColor;}",
      "minified CSS",
    );

    if (app.imported.length !== 1 || app.imported[0] !== base.path) {
      throw new Error(
        "Advanced example imported paths do not match the base instance",
      );
    }

    console.log("Advanced example assertions passed.");
  } finally {
    rmSync(outputDirectory, { recursive: true, force: true });
  }
};

if (import.meta.main) runAdvancedExample();
