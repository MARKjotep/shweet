import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Loader } from "../src/css";
import {
  advancedMediaFeatures,
  createAdvancedExample,
} from "./example/advanced";

type AdvancedApp = ReturnType<typeof createAdvancedExample>["app"];

const compile = (app: AdvancedApp, shaker: string[] = []) =>
  new Loader(app, shaker).load(true, advancedMediaFeatures);

/**
 * Saves the example exactly as the runnable entry point does, then reads the
 * artifacts before removing the temporary directory. Tests never write into the
 * repository's checked-in example files.
 */
const readExampleOutput = () => {
  const outputDirectory = mkdtempSync(join(tmpdir(), "shweet-advanced-test-"));

  try {
    const { base, app } = createAdvancedExample();

    app.save({ dir: outputDirectory, mapDir: outputDirectory, minify: false });
    app.save({ dir: outputDirectory, name: "advanced.min", minify: true });

    return {
      base,
      app,
      css: readFileSync(join(outputDirectory, "advanced.css"), "utf8"),
      minified: readFileSync(
        join(outputDirectory, "advanced.min.css"),
        "utf8",
      ),
      exportMap: readFileSync(join(outputDirectory, "index.js"), "utf8"),
    };
  } finally {
    rmSync(outputDirectory, { recursive: true, force: true });
  }
};

describe("advanced example integration", () => {
  test("composes distinct prefixes with media, supports, and string declarations", () => {
    const { base, app, css } = readExampleOutput();

    expect(app.imported).toEqual([base.path]);
    expect(css).toContain(".base_tile {");
    expect(css).toContain(".base_badge {");
    expect(css).toContain(".adv_panel {");
    expect(css).toContain(".adv_panel > .adv_panel-title {");
    expect(css).toContain(".adv_panel .adv_panel-body {");
    expect(css).toContain(".adv_panel + .adv_panel-step {");
    expect(css).toContain(".adv_panel ~ .adv_panel-note {");
    expect(css).toContain(".adv_panel:hover {");
    expect(css).toContain(".adv_panel:focus-visible {");
    expect(css).toContain(
      ".adv_panel:is(.adv_panel-title, .adv_panel-body) {",
    );
    expect(css).toContain(".adv_panel:not(.adv_panel-disabled) {");
    expect(css).toContain(".adv_panel:has(.adv_panel-icon) {");
    expect(css).toContain('.adv_panel[data-state="open"] {');
    expect(css).toContain(".adv_notice {");

    // A `Medyas` subclass preset writes xs base declarations; inserting `.MD`
    // before `compact` keeps those declarations and adds a md padding override.
    expect(css).toContain(".adv_surface {");
    expect(css).toContain(".adv_surface-inverse {");
    expect(css).toContain("border: 1px solid currentColor;");
    expect(css).toContain("@media (min-width: 768px)");

    // `f` builders produce declaration values that survive serialization.
    expect(css).toContain("width: calc(100% - 2rem);");
    expect(css).toContain("gap: clamp(1rem, 2rem, 3rem);");
    expect(css).toContain(
      "background-image: linear-gradient(to right, red, blue);",
    );
    expect(css).toContain("color: var(--brand-color, red);");

    // Imported features, a local feature, and a supports block all survive the
    // composition.
    expect(css).toContain("@media (max-width: 599px)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("@media (hover: hover)");
    expect(css).toContain("@supports(display:grid) {");

    // Quoted separators, data-url punctuation, and function arguments in a
    // declaration string were not split as top-level declarations.
    expect(css).toContain(
      'font-family: "Iowan Old Style", "Palatino Linotype", serif;',
    );
    expect(css).toContain(
      'background: url("data:image/svg+xml;utf8,<svg></svg>");',
    );
    expect(css).toContain(
      "grid-template-columns: repeat(2, minmax(0, 1fr));",
    );
    expect(css).toContain("opacity: 0.8;");
    expect(css).toContain("z-index: 2;");
  });

  test("uses the active export-map request for imported and local selectors", () => {
    const { app } = createAdvancedExample();

    const enabled = compile(app);
    const entries = new Map(enabled.CID.entries());

    expect(entries.size).toBe(15);
    expect(entries.get("tile")).toEqual(new Set(["base_tile"]));
    expect(entries.get("badge")).toEqual(new Set(["base_badge"]));
    expect(entries.get("fade_in")).toEqual(new Set(["base_fade-in"]));
    expect(entries.get("panel")).toEqual(new Set(["adv_panel"]));
    expect(entries.get("panel_title")).toEqual(new Set(["adv_panel-title"]));
    expect(entries.get("panel_body")).toEqual(new Set(["adv_panel-body"]));
    expect(entries.get("panel_step")).toEqual(new Set(["adv_panel-step"]));
    expect(entries.get("panel_note")).toEqual(new Set(["adv_panel-note"]));
    expect(entries.get("panel_disabled")).toEqual(
      new Set(["adv_panel-disabled"]),
    );
    expect(entries.get("panel_icon")).toEqual(new Set(["adv_panel-icon"]));
    expect(entries.get("notice")).toEqual(new Set(["adv_notice"]));
    expect(entries.get("slide_in")).toEqual(new Set(["adv_slide-in"]));
    expect(entries.get("surface")).toEqual(new Set(["adv_surface"]));
    expect(entries.get("surface_inverse")).toEqual(
      new Set(["adv_surface-inverse"]),
    );
    expect(entries.get("caption")).toEqual(new Set(["adv_caption"]));

    // The base instance opted out of its own map, but the active compilation
    // request is what decides: disabling it removes imported entries too.
    const disabled = new Loader(app).load(false, advancedMediaFeatures);
    expect([...disabled.CID.entries()]).toEqual([]);
  });

  test("writes a deterministic export map for the composed output", () => {
    const { exportMap } = readExampleOutput();

    expect(exportMap).toBe(
      'export const badge="base_badge",caption="adv_caption",' +
        'fade_in="base_fade-in",notice="adv_notice",' +
        'panel_body="adv_panel-body",panel_disabled="adv_panel-disabled",' +
        'panel_icon="adv_panel-icon",panel_note="adv_panel-note",' +
        'panel_step="adv_panel-step",panel_title="adv_panel-title",' +
        'panel="adv_panel",slide_in="adv_slide-in",' +
        'surface_inverse="adv_surface-inverse",surface="adv_surface",' +
        'tile="base_tile";',
    );
  });

  test("saves valid minified css without damaging protected tokens", () => {
    const { css, minified } = readExampleOutput();

    expect(minified.length).toBeLessThan(css.length);
    expect(minified).not.toContain("\n");

    expect(minified).toContain(
      ".adv_slide-in{animation:adv_slide 600ms cubic-bezier(0.2,0.8,0.2,1) both;}",
    );
    expect(minified).toContain('.adv_panel[data-state="open"]{');
    expect(minified).toContain(
      ".adv_panel:is(.adv_panel-title,.adv_panel-body){",
    );
    expect(minified).toContain("width:calc(100% - 2rem);");
    expect(minified).toContain("gap:clamp(1rem,2rem,3rem);");
    expect(minified).toContain(
      "background-image:linear-gradient(to right,red,blue);",
    );
    expect(minified).toContain("color:var(--brand-color,red);");
    expect(minified).toContain(
      ".base_fade-in{animation:base_fade 1s ease-out both;}",
    );
    expect(minified).toContain(
      'font-family:"Iowan Old Style","Palatino Linotype",serif;',
    );
    expect(minified).toContain(
      'background:url("data:image/svg+xml;utf8,<svg></svg>");',
    );
    expect(minified).toContain(
      "grid-template-columns:repeat(2,minmax(0,1fr));",
    );
    expect(minified).toContain("@keyframes base_fade{");
    expect(minified).toContain("@keyframes adv_slide{");
    expect(minified).toContain("@media (max-width:599px){");
    expect(minified).toContain("@media (prefers-reduced-motion:reduce){");
    expect(minified).toContain("@media (hover:hover){");
    expect(minified).toContain(
      ".adv_surface{display:block;padding:2rem;border-radius:0.5rem;" +
        "background-color:white;color:black;}",
    );
    expect(minified).toContain(
      ".adv_surface-inverse{display:block;padding:2rem;" +
        "border-radius:0.5rem;background-color:black;color:white;" +
        "border:1px solid currentColor;}",
    );
    expect(minified).toContain(
      "@media (min-width:768px){.adv_surface{padding:1rem;}}",
    );
  });

  test("keeps imported and local keyframes only while a shaker references them", () => {
    const { app } = createAdvancedExample();

    const referenced = new Loader(app, ["fade-in", "slide-in"]).load(
      false,
      advancedMediaFeatures,
    ).css;

    expect(referenced).toContain(".base_fade-in {");
    expect(referenced).toContain("animation: base_fade 1s ease-out both;");
    expect(referenced).toContain("@keyframes base_fade {");
    expect(referenced).toContain(".adv_slide-in {");
    expect(referenced).toContain(
      "animation: adv_slide 600ms cubic-bezier(0.2, 0.8, 0.2, 1) both;",
    );
    expect(referenced).toContain("@keyframes adv_slide {");
    expect(referenced).not.toContain(".base_tile");
    expect(referenced).not.toContain(".adv_panel");
    expect(referenced).not.toContain(".adv_caption");

    // A shaker that keeps a non-animating class drops both unreferenced
    // keyframe sets, including the imported one.
    const unrelated = new Loader(app, ["panel"]).load(
      false,
      advancedMediaFeatures,
    ).css;

    expect(unrelated).toContain(".adv_panel {");
    expect(unrelated).not.toContain("@keyframes");
  });

  test("recompilation and a fresh factory produce identical css and maps", () => {
    const { app } = createAdvancedExample();

    const first = compile(app);
    const second = compile(app);
    const fresh = compile(createAdvancedExample().app);

    expect(second.css).toBe(first.css);
    expect([...second.CID.entries()]).toEqual([...first.CID.entries()]);
    expect(fresh.css).toBe(first.css);
    expect([...fresh.CID.entries()]).toEqual([...first.CID.entries()]);
  });
});
