import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { f, med, media, ps, Shweet, supports } from "../src";
import { Loader } from "../src/css";

const compile = (
  shweet: Shweet,
  exportMap?: boolean,
  mediaFeatures: Record<string, unknown> = {},
) => new Loader(shweet).load(exportMap, mediaFeatures);

const temporaryDirectories: string[] = [];

const temporaryDirectory = (name: string) => {
  const directory = mkdtempSync(join(tmpdir(), `shweet-${name}-`));
  temporaryDirectories.push(directory);
  return directory;
};

afterAll(() => {
  temporaryDirectories.forEach((directory) => {
    rmSync(directory, { recursive: true, force: true });
  });
});

describe("conservative grouping", () => {
  test("keeps the approved overlapping-class source order", () => {
    const shweet = new Shweet({ __filename: "/virtual/overlap.ts" });

    shweet.c.a = { color: "red" };
    shweet.c.b = { color: "blue" };
    shweet.c.c = { color: "red" };

    const css = compile(shweet).css;

    expect(css).toBe(
      [
        "/* -------------- xs ( default ) */",
        ".a {",
        "  color: red;",
        "}",
        ".b {",
        "  color: blue;",
        "}",
        ".c {",
        "  color: red;",
        "}",
      ].join("\n"),
    );

    // CSS cascade order: for class="b c", .c wins because it comes after .b.
    expect(css.indexOf(".b {")).toBeLessThan(css.indexOf(".c {"));
  });

  test("merges adjacent rules with the exact same declarations", () => {
    const shweet = new Shweet({ __filename: "/virtual/adjacent.ts" });

    shweet.c.hello = { color: "red" };
    shweet.c.world = { color: "red" };
    shweet.c.hero = { color: "red" };

    expect(compile(shweet).css).toBe(
      [
        "/* -------------- xs ( default ) */",
        ".hello, .world, .hero {",
        "  color: red;",
        "}",
      ].join("\n"),
    );
  });

  test("does not merge identical declarations across an intervening rule", () => {
    const shweet = new Shweet({ __filename: "/virtual/non-adjacent.ts" });

    shweet.c.first = { color: "red" };
    shweet.c.middle = { color: "green" };
    shweet.c.last = { color: "red" };

    expect(compile(shweet).css).toBe(
      [
        "/* -------------- xs ( default ) */",
        ".first {",
        "  color: red;",
        "}",
        ".middle {",
        "  color: green;",
        "}",
        ".last {",
        "  color: red;",
        "}",
      ].join("\n"),
    );
  });

  test("keeps exact fallback and importance differences separate", () => {
    const shweet = new Shweet({ __filename: "/virtual/exact-values.ts" });

    shweet.c.a = { color: f.var("tone", "red"), margin: "0 !important" };
    shweet.c.b = { color: f.var("tone", "red"), margin: "0 !important" };
    shweet.c.c = { color: f.var("tone", "blue"), margin: "0 !important" };
    shweet.c.d = { color: f.var("tone", "red"), margin: "0" };

    expect(compile(shweet).css).toBe(
      [
        "/* -------------- xs ( default ) */",
        ".a, .b {",
        "  color: var(--tone, red); ",
        "  margin: 0 !important;",
        "}",
        ".c {",
        "  color: var(--tone, blue); ",
        "  margin: 0 !important;",
        "}",
        ".d {",
        "  color: var(--tone, red); ",
        "  margin: 0;",
        "}",
      ].join("\n"),
    );
  });

  test("does not reorder shorthand, longhand, all, or custom properties", () => {
    const shweet = new Shweet({ __filename: "/virtual/property-order.ts" });

    shweet.c.a = { margin: "0", marginTop: "1px" };
    shweet.c.b = { marginTop: "1px", margin: "0" };
    shweet.c.c = { all: "unset", color: "red" };
    shweet.c.d = { all: "revert", color: "red" };
    shweet.c.e = { "--beta": "2", "--alpha": "1" } as any;
    shweet.c.f = { "--alpha": "1", "--beta": "2" } as any;

    const css = compile(shweet).css;

    expect(css).toBe(
      [
        "/* -------------- xs ( default ) */",
        ".a {",
        "  margin: 0; ",
        "  margin-top: 1px;",
        "}",
        ".b {",
        "  margin-top: 1px; ",
        "  margin: 0;",
        "}",
        ".c {",
        "  all: unset; ",
        "  color: red;",
        "}",
        ".d {",
        "  all: revert; ",
        "  color: red;",
        "}",
        ".e {",
        "  --beta: 2; ",
        "  --alpha: 1;",
        "}",
        ".f {",
        "  --alpha: 1; ",
        "  --beta: 2;",
        "}",
      ].join("\n"),
    );
  });

  test("keeps nested and quoted selector expressions intact when merging", () => {
    const shweet = new Shweet({ __filename: "/virtual/selector-expressions.ts" });

    shweet.c.x = ps.attr({ title: "a,b" })({ color: "red" });
    shweet.c.y = ps.is(".a, .b")({ color: "red" });

    expect(compile(shweet).css).toBe(
      [
        "/* -------------- xs ( default ) */",
        '.x[title="a,b"], .y:is(.a, .b) {',
        "  color: red;",
        "}",
      ].join("\n"),
    );
  });

  test("groups within media and supports contexts without crossing them", () => {
    const shweet = new Shweet({
      __filename: "/virtual/contexts.ts",
      mediaFeature: { ss: "(display-mode: standalone)" },
    });

    shweet.c.a = [
      { color: med("red", { md: "blue", ss: "green" }) },
      supports({ display: "grid" })({ display: "grid" }),
    ];
    shweet.c.b = [
      { color: "red" },
      supports({ display: "grid" })({ display: "grid" }),
    ];

    expect(compile(shweet, false, { ss: "(display-mode: standalone)" }).css).toBe(
      [
        "/* -------------- xs ( default ) */",
        ".a, .b {",
        "  color: red;",
        "}",
        "@supports(display:grid) {",
        "  .a, .b {",
        "  display: grid;",
        "}",
        "}",
        "/* -------------- md */",
        "@media (min-width: 768px)\t{",
        ".a {",
        "  color: blue;",
        "}",
        "}",
        "/* -------------- ss */",
        "@media (display-mode: standalone)\t{",
        ".a {",
        "  color: green;",
        "}",
        "}",
      ].join("\n"),
    );
  });
});

describe("grouping isolation and animation behavior", () => {
  test("repeated compiles produce identical css", () => {
    const shweet = new Shweet({ __filename: "/virtual/repeat-compile.ts" });

    shweet.c.a = { color: "red" };
    shweet.c.b = { color: "red" };

    const first = compile(shweet);
    const second = compile(shweet);

    expect(second.css).toBe(first.css);
  });

  test("custom media features do not leak into later compilations", () => {
    const shweet = new Shweet({ __filename: "/virtual/feature-leak.ts" });

    shweet.c.a = { color: med("red", { ss: "green" }) };

    const first = compile(shweet, false, {
      ss: "(display-mode: standalone)",
    });
    const second = compile(shweet);

    expect(first.css).toContain("@media (display-mode: standalone)");
    expect(second.css).not.toContain("display-mode");
    expect(second.css).not.toContain("@media");
  });

  test("separate instances keep their own media features", () => {
    const first = new Shweet({
      __filename: "/virtual/feature-first.ts",
      mediaFeature: { ss: "(display-mode: standalone)" },
    });
    first.c.a = { color: med("red", { ss: "green" }) };

    const second = new Shweet({
      __filename: "/virtual/feature-second.ts",
      mediaFeature: { ss: "(monochrome)" },
    });
    second.c.b = { color: med("red", { ss: "green" }) };

    const firstCss = compile(first, false, {
      ss: "(display-mode: standalone)",
    }).css;
    const secondCss = compile(second, false, { ss: "(monochrome)" }).css;

    expect(firstCss).toContain("@media (display-mode: standalone)");
    expect(firstCss).not.toContain("(monochrome)");
    expect(secondCss).toContain("@media (monochrome)");
    expect(secondCss).not.toContain("display-mode");
  });

  test("keeps intentional static media default changes", () => {
    const original = media.prop.md;

    try {
      media.prop.md = "(min-width: 777px)";

      const shweet = new Shweet({ __filename: "/virtual/static-default.ts" });
      shweet.c.a = { color: med("red", { md: "blue" }) };

      expect(compile(shweet).css).toContain("@media (min-width: 777px)");
    } finally {
      media.prop.md = original;
    }
  });

  test("merges adjacent animation rules and keeps keyframes last", () => {
    const shweet = new Shweet({
      __filename: "/virtual/animation-group.ts",
      prefix: "p",
    });

    shweet.kf.bounce = {
      from: { opacity: 0 },
      to: { opacity: 1 },
    };
    shweet.c.normal = { color: "blue" };
    shweet.c.animated = { animation: "bounce 2s infinite" };
    shweet.c.animatedToo = { animation: "bounce 2s infinite" };

    const loader = compile(shweet);
    const second = compile(shweet);

    expect(loader.css).toBe(
      [
        "/* -------------- xs ( default ) */",
        ".p_animated, .p_animatedToo {",
        "  animation: p_bounce 2s infinite;",
        "}",
        ".p_normal {",
        "  color: blue;",
        "}",
        "@keyframes p_bounce {",
        "  from {",
        "  opacity: 0;",
        "} ",
        "  to {",
        "  opacity: 1;",
        "}",
        "}",
      ].join("\n"),
    );
    // Animation prefixing happens at assignment time, not per compile.
    expect(second.css).toBe(loader.css);
  });

  test("does not double-prefix a shared animation media input", () => {
    const shweet = new Shweet({
      __filename: "/virtual/shared-animation.ts",
      prefix: "p",
    });
    const shared = med("bounce 2s infinite");

    shweet.c.first = { animation: shared };
    shweet.c.second = { animation: shared };

    expect(compile(shweet).css).toBe(
      [
        "/* -------------- xs ( default ) */",
        ".p_first, .p_second {",
        "  animation: p_bounce 2s infinite;",
        "}",
      ].join("\n"),
    );
  });

  test("keeps keyframes referenced by a shaken-in class", () => {
    const shweet = new Shweet({
      __filename: "/virtual/shaken-keyframes.ts",
      prefix: "p",
    });

    shweet.kf.bounce = {
      from: { opacity: 0 },
      to: { opacity: 1 },
    };
    shweet.c.animated = { animation: "bounce 2s" };
    shweet.c.other = { color: "blue" };

    const animated = new Loader(shweet, ["animated"]).load().css;
    expect(animated).toContain(".p_animated");
    expect(animated).toContain("@keyframes p_bounce");
    expect(animated).not.toContain(".p_other");

    // With an unrelated class the animation, and therefore its keyframes, are
    // not referenced.
    const other = new Loader(shweet, ["other"]).load().css;
    expect(other).toContain(".p_other");
    expect(other).not.toContain("@keyframes");
  });

  test("reusing a loader resets export-map entries per compilation", () => {
    const shweet = new Shweet({
      __filename: "/virtual/loader-reuse.ts",
      exportMap: true,
    });

    shweet.c.a = { color: "red" };

    const loader = new Loader(shweet);

    loader.load(true);
    expect([...loader.CID.keys()]).toEqual(["a"]);

    // The second compilation must not inherit the first compilation's map.
    loader.load(false);
    expect([...loader.CID.entries()]).toEqual([]);

    loader.load(true);
    expect([...loader.CID.entries()]).toEqual([["a", new Set(["a"])]]);
  });

  test("saved output keeps conservative order", () => {
    const directory = temporaryDirectory("conservative");
    const shweet = new Shweet({ __filename: "/virtual/saved-order.ts" });

    shweet.c.a = { color: "red" };
    shweet.c.b = { color: "blue" };
    shweet.c.c = { color: "red" };

    shweet.save({ dir: directory, minify: false });

    expect(readFileSync(join(directory, "saved-order.css"), "utf8")).toBe(
      [
        "/* -------------- xs ( default ) */",
        ".a {",
        "  color: red;",
        "}",
        ".b {",
        "  color: blue;",
        "}",
        ".c {",
        "  color: red;",
        "}",
      ].join("\n"),
    );
  });
});

describe("imported Shweet composition", () => {
  test("an imported exportMap:true base does not add entries to load(false)", () => {
    const base = new Shweet({
      __filename: "/virtual/imported-exported.ts",
      prefix: "base",
      exportMap: true,
    });
    base.c.shared = { color: "red" };

    const parent = new Shweet({
      __filename: "/virtual/imported-exported-parent.ts",
      shweets: [base],
    });

    const loader = new Loader(parent).load(false);

    expect(loader.css).toContain(".base_shared");
    expect([...loader.CID.entries()]).toEqual([]);
  });

  test("a nested import with exportMap:false contributes entries to load(true)", () => {
    const base = new Shweet({
      __filename: "/virtual/imported-plain.ts",
      prefix: "base",
      exportMap: false,
    });
    base.c.shared = { color: "red" };

    const middle = new Shweet({
      __filename: "/virtual/imported-plain-middle.ts",
      prefix: "mid",
      shweets: [base],
    });

    const top = new Shweet({
      __filename: "/virtual/imported-plain-top.ts",
      prefix: "top",
      shweets: [middle],
    });

    const loader = new Loader(top).load(true);

    expect(loader.css).toContain(".base_shared");
    expect([...loader.CID.entries()]).toEqual([
      ["shared", new Set(["base_shared"])],
    ]);
  });

  test("a shaken nested imported class keeps its imported keyframes", () => {
    const root = new Shweet({
      __filename: "/virtual/nested-root.ts",
      prefix: "root",
    });
    root.kf.drift = {
      from: { transform: "translateX(0)" },
      to: { transform: "translateX(1rem)" },
    };
    root.kf.unused = {
      from: { opacity: 0 },
      to: { opacity: 1 },
    };
    root.c["drift-in"] = { animation: "drift 1s" };
    root.c.other = { color: "red" };

    const middle = new Shweet({
      __filename: "/virtual/nested-middle.ts",
      prefix: "mid",
      shweets: [root],
    });
    middle.c.middle = { color: "blue" };

    const top = new Shweet({
      __filename: "/virtual/nested-top.ts",
      prefix: "top",
      shweets: [middle],
    });

    const css = new Loader(top, ["drift-in"]).load().css;

    expect(css).toContain(".root_drift-in {");
    expect(css).toContain("animation: root_drift 1s;");
    expect(css).toContain("@keyframes root_drift {");
    expect(css).not.toContain(".root_other");
    expect(css).not.toContain("@keyframes root_unused");
    expect(css).not.toContain(".mid_middle");
  });
});
