import { describe, expect, test } from "bun:test";
import { med, Shweet, Var } from "../src";
import { Loader } from "../src/css";

const compile = (shweet: Shweet) => new Loader(shweet).load(false).css;

/** One media bucket of the rendered sheet, keyed by its marker comment. */
const bucket = (css: string, marker: string) => {
  const start = css.indexOf(marker);
  if (start === -1) return "";

  const next = css.indexOf("/* --------------", start + marker.length);
  return css.slice(start, next === -1 ? undefined : next);
};

const valuesOf = (css: string, property: string) =>
  [...css.matchAll(new RegExp(`${property}: ([^;]+);`, "g"))].map(
    (match) => match[1],
  );

const createTokens = () => {
  const tokens = new Shweet({ __filename: "/virtual/tokens.ts", prefix: "dk" });
  const accent = Var({
    acc: med("#2563eb", { light: "#2563eb", dark: "#60a5fa" }),
  });

  tokens.d[":root"] = [
    accent,
    Var({ surface: med("#ffffff", { light: "#ffffff", dark: "#0f172a" }) }),
  ];
  tokens.c.btn = { color: accent.__() };

  return tokens;
};

describe("override", () => {
  test("overrides win the cascade after the original chain", () => {
    const themed = createTokens().override({ acc: "#e11d48" });
    const group = new Shweet({
      __filename: "/virtual/group.ts",
      prefix: "group",
      shweets: [themed],
    });

    const css = compile(group);
    const defaults = bucket(css, "/* -------------- xs ( default ) */");
    const dark = bucket(css, "/* -------------- dark */");

    expect(valuesOf(defaults, "--acc")).toEqual(["#2563eb", "#e11d48"]);
    expect(valuesOf(dark, "--acc")).toEqual(["#60a5fa", "#e11d48"]);
  });

  test("a flat value applies to both light and dark modes", () => {
    const css = compile(createTokens().override({ acc: "#e11d48" }));

    expect(valuesOf(bucket(css, "/* -------------- xs ( default ) */"), "--acc")).toEqual([
      "#2563eb",
      "#e11d48",
    ]);
    expect(valuesOf(bucket(css, "/* -------------- dark */"), "--acc")).toEqual([
      "#60a5fa",
      "#e11d48",
    ]);
    expect(valuesOf(bucket(css, "/* -------------- light */"), "--acc")).toEqual([
      "#2563eb",
      "#e11d48",
    ]);
  });

  test("an explicit pair sets each scheme without a default-bucket value", () => {
    const css = compile(
      createTokens().override({
        acc: { light: "#059669", dark: "#34d399" },
      }),
    );

    // The pair only adds light/dark values; the default bucket keeps the token.
    expect(valuesOf(bucket(css, "/* -------------- xs ( default ) */"), "--acc")).toEqual([
      "#2563eb",
    ]);
    expect(valuesOf(bucket(css, "/* -------------- light */"), "--acc")).toEqual([
      "#2563eb",
      "#059669",
    ]);
    expect(valuesOf(bucket(css, "/* -------------- dark */"), "--acc")).toEqual([
      "#60a5fa",
      "#34d399",
    ]);

    // Selectors and `var(--…)` references stay stable.
    expect(css).toContain(":root {");
    expect(css).toContain(".dk_btn {\n  color: var(--acc);\n}");
  });

  test("empty overrides emit byte-identical css", () => {
    const tokens = createTokens();
    const expected = compile(tokens);

    expect(compile(tokens.override())).toBe(expected);
    expect(compile(tokens.override({}))).toBe(expected);
  });

  test("undefined entries are ignored", () => {
    const tokens = createTokens();

    expect(compile(tokens.override({ acc: undefined }))).toBe(compile(tokens));
  });
});
