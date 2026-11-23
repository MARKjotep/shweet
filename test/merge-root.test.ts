import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { med, Shweet, Var } from "../src";
import { Loader } from "../src/css";

const compile = (shweet: Shweet, mergeRoot = false) =>
  new Loader(shweet, [], [], undefined, mergeRoot).load(false).css;

const count = (css: string, needle: string) => css.split(needle).length - 1;

const temporaryDirectories: string[] = [];

const temporaryDirectory = (name: string) => {
  const directory = mkdtempSync(join(tmpdir(), `shweet-merge-root-${name}-`));
  temporaryDirectories.push(directory);
  return directory;
};

afterAll(() => {
  temporaryDirectories.forEach((directory) => {
    rmSync(directory, { recursive: true, force: true });
  });
});

/**
 * Three chained instances that each assign `d[":root"]`. Own declarations are
 * collected before imports, so the emitted order is `c`, `b`, `a`.
 */
const createChain = () => {
  const base = new Shweet({ __filename: "/virtual/root-a.ts" });
  base.d[":root"] = [Var({ a: med("red", { dark: "darkred" }) })];

  const middle = new Shweet({
    __filename: "/virtual/root-b.ts",
    shweets: [base],
  });
  middle.d[":root"] = [Var({ b: med("blue", { dark: "darkblue" }) })];

  const top = new Shweet({
    __filename: "/virtual/root-c.ts",
    shweets: [middle],
  });
  top.d[":root"] = [Var({ c: med("green", { dark: "darkgreen" }) })];

  return top;
};

describe("mergeRoot", () => {
  test("folds N chained :root blocks into one per bucket in source order", () => {
    const css = compile(createChain(), true);

    expect(css).toBe(
      [
        "/* -------------- xs ( default ) */",
        ":root {",
        "  --c: green; ",
        "  --b: blue; ",
        "  --a: red;",
        "}",
        "/* -------------- dark */",
        "@media (prefers-color-scheme: dark)\t{",
        ":root {",
        "  --c: darkgreen; ",
        "  --b: darkblue; ",
        "  --a: darkred;",
        "}",
        "}",
      ].join("\n"),
    );
    expect(count(css, ":root {")).toBe(2);
    expect(count(css, "prefers-color-scheme: dark")).toBe(1);
  });

  test("leaves the unmerged output byte-identical when disabled", () => {
    const chain = createChain();
    const defaults = compile(chain);
    const explicit = compile(chain, false);

    expect(explicit).toBe(defaults);
    expect(count(defaults, ":root {")).toBe(6);
    expect(count(defaults, "prefers-color-scheme: dark")).toBe(1);
  });

  test("never folds a group whose selectors are not exactly :root", () => {
    const first = new Shweet({ __filename: "/virtual/mixed-first.ts" });
    first.d[":root"] = { color: "red" };
    first.d[".x"] = { color: "red" };

    const second = new Shweet({
      __filename: "/virtual/mixed-second.ts",
      shweets: [first],
    });
    second.d[":root"] = { backgroundColor: "blue" };

    expect(compile(second, true)).toBe(
      [
        "/* -------------- xs ( default ) */",
        ":root {",
        "  background-color: blue;",
        "}",
        ":root, .x {",
        "  color: red;",
        "}",
      ].join("\n"),
    );
  });

  test("save merges root blocks only when the option is enabled", () => {
    const plainDirectory = temporaryDirectory("plain");
    const explicitDirectory = temporaryDirectory("explicit");
    const mergedDirectory = temporaryDirectory("merged");

    const plain = createChain();
    const explicit = createChain();
    const merged = createChain();

    plain.save({ dir: plainDirectory, minify: false });
    explicit.save({ dir: explicitDirectory, minify: false, mergeRoot: false });
    merged.save({ dir: mergedDirectory, minify: false, mergeRoot: true });

    const plainCss = readFileSync(
      join(plainDirectory, `${plain.name}.css`),
      "utf8",
    );
    const explicitCss = readFileSync(
      join(explicitDirectory, `${explicit.name}.css`),
      "utf8",
    );
    const mergedCss = readFileSync(
      join(mergedDirectory, `${merged.name}.css`),
      "utf8",
    );

    expect(explicitCss).toBe(plainCss);
    expect(count(plainCss, ":root {")).toBe(6);
    expect(count(mergedCss, ":root {")).toBe(2);
    expect(count(mergedCss, "prefers-color-scheme: dark")).toBe(1);
  });
});
