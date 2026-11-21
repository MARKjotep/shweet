import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Shweet, med, ps, supports } from "../src";
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

describe("css compilation", () => {
  test("groups identical declarations in source order", () => {
    const shweet = new Shweet({ __filename: "/virtual/grouped.ts" });

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

  test("keeps distinct serialized values separate", () => {
    const shweet = new Shweet({ __filename: "/virtual/distinct.ts" });

    shweet.c.zero = { padding: 0 };
    shweet.c.pixels = { padding: "0px" };
    shweet.c.points = { padding: "0pt" };

    expect(compile(shweet).css).toBe(
      [
        "/* -------------- xs ( default ) */",
        ".zero {",
        "  padding: 0rem;",
        "}",
        ".pixels {",
        "  padding: 0px;",
        "}",
        ".points {",
        "  padding: 0pt;",
        "}",
      ].join("\n"),
    );
  });

  test("shares one block when selector lists match", () => {
    const shweet = new Shweet({ __filename: "/virtual/lists.ts" });

    shweet.c.a = { color: "red", backgroundColor: "blue" };
    shweet.c.b = { color: "red", backgroundColor: "blue" };

    expect(compile(shweet).css).toBe(
      [
        "/* -------------- xs ( default ) */",
        ".a, .b {",
        "  color: red; ",
        "  background-color: blue;",
        "}",
      ].join("\n"),
    );
  });

  test("keeps media and supports context around declarations", () => {
    const shweet = new Shweet({
      __filename: "/virtual/media.ts",
      mediaFeature: { ss: "(display-mode: standalone)" },
    });

    shweet.c.a = [
      { color: "red" },
      supports({ display: "grid" })({ display: "grid" }),
    ];
    shweet.c.b = { color: med("red", { md: "blue", ss: "green" }) };

    expect(
      compile(shweet, false, { ss: "(display-mode: standalone)" }).css,
    ).toBe(
      [
        "/* -------------- xs ( default ) */",
        ".a, .b {",
        "  color: red;",
        "}",
        "@supports(display:grid) {",
        "  .a {",
        "  display: grid;",
        "}",
        "}",
        "/* -------------- md */",
        "@media (min-width: 768px)\t{",
        ".b {",
        "  color: blue;",
        "}",
        "}",
        "/* -------------- ss */",
        "@media (display-mode: standalone)\t{",
        ".b {",
        "  color: green;",
        "}",
        "}",
      ].join("\n"),
    );
  });

  test("keeps commas inside functional pseudos and attribute values", () => {
    const shweet = new Shweet({ __filename: "/virtual/commas.ts" });

    shweet.c.q = [
      ps.attr({ title: "a,b" })({ color: "red" }),
      ps.is(".a, .b")({ color: "red" }),
    ];

    expect(compile(shweet).css).toBe(
      [
        "/* -------------- xs ( default ) */",
        '.q[title="a,b"], .q:is(.a, .b) {',
        "  color: red;",
        "}",
      ].join("\n"),
    );
  });

  test("moves animation rules first and keeps keyframes after style rules", () => {
    const shweet = new Shweet({ __filename: "/virtual/reorder.ts", prefix: "p" });

    shweet.kf.bounce = {
      from: { opacity: 0 },
      "50%": { opacity: 0.5 },
      to: { opacity: 1 },
    };
    shweet.c.normal = { color: "blue" };
    shweet.c.animated = {
      animation: "bounce 2s infinite",
      transition: "all 1s ease-in-out",
    };

    expect(compile(shweet, true).css).toBe(
      [
        "/* -------------- xs ( default ) */",
        ".p_animated {",
        "  animation: p_bounce 2s infinite; ",
        "  transition: all 1s ease-in-out;",
        "}",
        ".p_normal {",
        "  color: blue;",
        "}",
        "@keyframes p_bounce {",
        "  from {",
        "  opacity: 0;",
        "} ",
        "  50% {",
        "  opacity: 0.5;",
        "} ",
        "  to {",
        "  opacity: 1;",
        "}",
        "}",
      ].join("\n"),
    );
  });

  test("includes imported instances and their export map entries", () => {
    const base = new Shweet({
      __filename: "/virtual/base.ts",
      prefix: "x",
      exportMap: true,
    });
    base.c.shared = { color: "red" };

    const child = new Shweet({
      __filename: "/virtual/child.ts",
      prefix: "y",
      exportMap: true,
      shweets: [base],
    });
    child.c.own = { color: "blue" };

    const loader = compile(child, true);

    expect(loader.css).toBe(
      [
        "/* -------------- xs ( default ) */",
        ".y_own {",
        "  color: blue;",
        "}",
        ".x_shared {",
        "  color: red;",
        "}",
      ].join("\n"),
    );
    expect([...loader.CID.entries()]).toEqual([
      ["own", new Set(["y_own"])],
      ["shared", new Set(["x_shared"])],
    ]);
    expect(child.imported).toEqual(["/virtual/base.ts"]);
  });

  test("renders at-rules and font faces before style blocks", () => {
    const shweet = new Shweet({ __filename: "/virtual/at.ts" });

    shweet.at.import = "url('a.css')";
    shweet.at.charset = "utf-8";
    shweet.font.myFont = {
      fontDisplay: "swap",
      src: "url('a.woff2')",
    } as any;
    shweet.c.a = { color: "red" };

    expect(compile(shweet).css).toBe(
      [
        '@import url(\'a.css\');',
        '@charset "utf-8";',
        "@font-face {",
        "\tfont-family: 'myFont';",
        "\tfont-display: swap;",
        "\tsrc: url('a.woff2');",
        "}",
        "/* -------------- xs ( default ) */",
        ".a {",
        "  color: red;",
        "}",
      ].join("\n"),
    );
  });

  test("export map keys use class names without the prefix", () => {
    const shweet = new Shweet({
      __filename: "/virtual/map.ts",
      prefix: "x",
      exportMap: true,
    });

    shweet.d["#main"] = { color: "blue" };
    shweet.c["foo-bar"] = { color: "red" };
    shweet.c.a_b = { color: "green" };

    const loader = compile(shweet, true);

    expect(loader.css).toBe(
      [
        "/* -------------- xs ( default ) */",
        "#x_main {",
        "  color: blue;",
        "}",
        ".x_foo-bar {",
        "  color: red;",
        "}",
        ".x_a_b {",
        "  color: green;",
        "}",
      ].join("\n"),
    );
    expect([...loader.CID.entries()]).toEqual([
      ["main", new Set(["x_main"])],
      ["foo_bar", new Set(["x_foo-bar"])],
      ["a_b", new Set(["x_a_b"])],
    ]);
  });
});

describe("css saving", () => {
  const createSavedShweet = () =>
    new Shweet({ __filename: "/virtual/repeat.ts", prefix: "x" });

  test("repeated saves write identical css and export maps", () => {
    const firstDirectory = temporaryDirectory("first");
    const secondDirectory = temporaryDirectory("second");
    const shweet = createSavedShweet();

    shweet.c.a = { color: "red" };
    shweet.c.b = { color: "red" };

    shweet.save({
      dir: firstDirectory,
      mapDir: firstDirectory,
      minify: false,
    });
    shweet.save({
      dir: secondDirectory,
      mapDir: secondDirectory,
      minify: false,
    });

    const firstCss = readFileSync(join(firstDirectory, "repeat.css"), "utf8");
    const secondCss = readFileSync(join(secondDirectory, "repeat.css"), "utf8");
    const firstMap = readFileSync(join(firstDirectory, "index.js"), "utf8");
    const secondMap = readFileSync(join(secondDirectory, "index.js"), "utf8");

    expect(firstCss).toBe(
      [
        "/* -------------- xs ( default ) */",
        ".x_a, .x_b {",
        "  color: red;",
        "}",
      ].join("\n"),
    );
    expect(firstCss).toBe(secondCss);
    expect(firstMap).toBe('export const a="x_a",b="x_b";');
    expect(firstMap).toBe(secondMap);
  });

  test("minifies saved css with the existing whitespace rules", () => {
    const directory = temporaryDirectory("minified");
    const shweet = createSavedShweet();

    shweet.c.a = { color: "red" };
    shweet.c.b = { color: "red" };

    shweet.save({ dir: directory, name: "mini" });

    expect(readFileSync(join(directory, "mini.css"), "utf8")).toBe(
      ".x_a,.x_b{color:red;}",
    );
  });

  test("separate instances compile independently", () => {
    const first = createSavedShweet();
    first.c.a = { color: "red" };

    const second = new Shweet({
      __filename: "/virtual/other.ts",
      prefix: "x",
    });
    second.c.z = { color: "red" };

    expect(compile(first).css).toBe(
      [
        "/* -------------- xs ( default ) */",
        ".x_a {",
        "  color: red;",
        "}",
      ].join("\n"),
    );
    expect(compile(second).css).toBe(
      [
        "/* -------------- xs ( default ) */",
        ".x_z {",
        "  color: red;",
        "}",
      ].join("\n"),
    );
  });
});
