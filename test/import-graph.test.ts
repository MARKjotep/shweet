import { describe, expect, test } from "bun:test";
import { Shweet } from "../src";
import { Loader } from "../src/css";

const compile = (shweet: Shweet, exportMap: boolean = true) =>
  new Loader(shweet).load(exportMap);

const countOccurrences = (css: string, needle: string) =>
  css.split(needle).length - 1;

/**
 * Reaches the handler tree through the existing Proxy facade. This is internal
 * state, not a supported construction path; it exists only so the traversal
 * guards can be characterized without adding public API.
 */
const internalImports = (handler: unknown): unknown[] =>
  (handler as { IMPORTED: unknown[] }).IMPORTED;

describe("duplicate imports", () => {
  test("the same imported instance is emitted once in first-seen order", () => {
    const base = new Shweet({
      __filename: "/virtual/import-graph/base.ts",
      prefix: "base",
    });
    base.c.zebra = { color: "red" };
    base.c.alpha = { color: "blue" };
    base.kf.turn = {
      from: { opacity: 0 },
      to: { opacity: 1 },
    };
    base.c.spin = { animation: "turn 1s" };
    base.at.charset = "utf-8";

    const parent = new Shweet({
      __filename: "/virtual/import-graph/parent.ts",
      prefix: "parent",
      shweets: [base, base],
    });
    parent.c.own = { color: "green" };

    const loader = compile(parent);

    // Local declarations come first, then the imported instance once: no
    // duplicated rules, selector list entries, keyframes, or at-rules.
    expect(loader.css).toBe(
      [
        '@charset "utf-8";',
        "/* -------------- xs ( default ) */",
        ".base_spin {",
        "  animation: base_turn 1s;",
        "}",
        ".parent_own {",
        "  color: green;",
        "}",
        ".base_zebra {",
        "  color: red;",
        "}",
        ".base_alpha {",
        "  color: blue;",
        "}",
        "@keyframes base_turn {",
        "  from {",
        "  opacity: 0;",
        "} ",
        "  to {",
        "  opacity: 1;",
        "}",
        "}",
      ].join("\n"),
    );

    expect([...loader.CID.entries()]).toEqual([
      ["own", new Set(["parent_own"])],
      ["zebra", new Set(["base_zebra"])],
      ["alpha", new Set(["base_alpha"])],
      ["spin", new Set(["base_spin"])],
    ]);
    expect(parent.imported).toEqual([base.path]);

    // Shaking keeps the same first-seen output and does not repeat the
    // retained imported rule.
    const shaken = new Loader(parent, ["alpha"]).load(false);
    expect(shaken.css).toBe(
      [
        '@charset "utf-8";',
        "/* -------------- xs ( default ) */",
        ".base_alpha {",
        "  color: blue;",
        "}",
      ].join("\n"),
    );
  });

  test("nested duplicates are emitted once in depth-first first-seen order", () => {
    const base = new Shweet({
      __filename: "/virtual/import-graph/base-nested.ts",
      prefix: "base",
    });
    base.c.shared = { color: "red" };
    base.kf.pulse = {
      from: { opacity: 0 },
      to: { opacity: 1 },
    };
    base.c.animated = { animation: "pulse 1s" };

    const middle = new Shweet({
      __filename: "/virtual/import-graph/middle.ts",
      prefix: "middle",
      shweets: [base, base],
    });
    middle.c.own = { color: "blue" };

    const top = new Shweet({
      __filename: "/virtual/import-graph/top.ts",
      prefix: "top",
      shweets: [middle, base, base],
    });
    top.c.local = { color: "green" };

    const loader = compile(top);

    expect(countOccurrences(loader.css, ".base_shared {")).toBe(1);
    expect(countOccurrences(loader.css, ".base_animated {")).toBe(1);
    expect(countOccurrences(loader.css, ".middle_own {")).toBe(1);
    expect(countOccurrences(loader.css, ".top_local {")).toBe(1);
    expect(countOccurrences(loader.css, "@keyframes base_pulse")).toBe(1);
    expect(countOccurrences(loader.css, "from {")).toBe(1);

    // Depth-first: the importer's own rules, then its import, then the base.
    const localIndex = loader.css.indexOf(".top_local {");
    const middleIndex = loader.css.indexOf(".middle_own {");
    const baseIndex = loader.css.indexOf(".base_shared {");
    expect(localIndex).toBeLessThan(middleIndex);
    expect(middleIndex).toBeLessThan(baseIndex);

    expect([...loader.CID.entries()]).toEqual([
      ["local", new Set(["top_local"])],
      ["own", new Set(["middle_own"])],
      ["shared", new Set(["base_shared"])],
      ["animated", new Set(["base_animated"])],
    ]);

    // The introspected path list reports each path once, including nested ones.
    expect(top.imported).toEqual([middle.path, base.path]);

    const second = compile(top);
    expect(second.css).toBe(loader.css);
    expect([...second.CID.entries()]).toEqual([...loader.CID.entries()]);
  });

  test("distinct instances sharing a path stay isolated and both compile", () => {
    const first = new Shweet({
      __filename: "/virtual/import-graph/same.ts",
      prefix: "one",
      unit: "px",
    });
    first.c.shared = { padding: 1 };

    const second = new Shweet({
      __filename: "/virtual/import-graph/same.ts",
      prefix: "two",
      unit: "rem",
    });
    second.c.shared = { padding: 1 };

    const parent = new Shweet({
      __filename: "/virtual/import-graph/distinct-parent.ts",
      prefix: "parent",
      shweets: [first, second, first],
    });

    const loader = compile(parent);

    // Identity deduplication keeps both distinct instances even though their
    // source paths match, and each keeps its own prefix and unit option.
    expect(loader.css).toBe(
      [
        "/* -------------- xs ( default ) */",
        ".one_shared {",
        "  padding: 1px;",
        "}",
        ".two_shared {",
        "  padding: 1rem;",
        "}",
      ].join("\n"),
    );
    expect(loader.CID.get("shared")).toEqual(
      new Set(["one_shared", "two_shared"]),
    );

    // The path list is a path set: two instances that share a path can only
    // report that path once, while their compiled output remains distinct.
    expect(parent.imported).toEqual([first.path]);

    const secondCompile = compile(parent);
    expect(secondCompile.css).toBe(loader.css);
    expect([...secondCompile.CID.entries()]).toEqual([
      ...loader.CID.entries(),
    ]);
  });
});

describe("import traversal guards", () => {
  test("internally linked cycles terminate deterministically", () => {
    const first = new Shweet({
      __filename: "/virtual/import-graph/cycle-a.ts",
      prefix: "cycle",
    });
    first.c.one = { color: "red" };
    first.kf.spin = {
      from: { opacity: 0 },
      to: { opacity: 1 },
    };
    first.c.animated = { animation: "spin 1s" };
    first.font.myFont = {
      fontDisplay: "swap",
      src: "url('a.woff2')",
    } as any;
    first.at.charset = "utf-8";

    const second = new Shweet({
      __filename: "/virtual/import-graph/cycle-b.ts",
      prefix: "other",
    });
    second.c.two = { color: "blue" };

    // Cycles cannot be produced by the `shweets` constructor because an
    // instance must exist before it can be imported. These links exercise the
    // defensive guards for unsupported internal mutation only.
    internalImports(first.c).push(first.c, second.c);
    internalImports(second.c).push(first.c);
    internalImports(first.kf).push(first.kf);
    internalImports(first.font).push(first.font);
    internalImports(first.at).push(first.at);

    const loader = compile(first);

    expect(countOccurrences(loader.css, ".cycle_one {")).toBe(1);
    expect(countOccurrences(loader.css, ".other_two {")).toBe(1);
    expect(countOccurrences(loader.css, ".cycle_animated {")).toBe(1);
    expect(countOccurrences(loader.css, "@keyframes cycle_spin")).toBe(1);
    expect(countOccurrences(loader.css, "@font-face")).toBe(1);
    expect(countOccurrences(loader.css, '@charset "utf-8";')).toBe(1);
    expect([...loader.CID.keys()]).toEqual(["one", "animated", "two"]);

    const secondCompile = compile(first);
    expect(secondCompile.css).toBe(loader.css);
  });
});
