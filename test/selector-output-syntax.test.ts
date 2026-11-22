import { describe, expect, test } from "bun:test";
import { ps, Shweet } from "../src";
import { Loader } from "../src/css";
import { minifyCss } from "../src/output/minify";

const compile = (shweet: Shweet) => new Loader(shweet).load();

describe("selector prefixing syntax boundaries", () => {
  test("prefixes class/id tokens in ordinary and functional selectors", () => {
    const shweet = new Shweet({
      __filename: "/virtual/prefix-tokens.ts",
      prefix: "p",
    });

    shweet.c.plain = { color: "red" };
    shweet.c["label#target"] = { color: "blue" };
    shweet.c.fn = ps.is(".a, #b, [title='.fake, #fake']")({
      color: "green",
    });

    const css = compile(shweet).css;

    expect(css).toContain(".p_plain {");
    expect(css).toContain(".p_label#p_target {");
    expect(css).toContain(
      ".p_fn:is(.p_a, #p_b, [title='.fake, #fake']) {",
    );
  });

  test("does not prefix dots or hashes inside attribute values and comments", () => {
    const shweet = new Shweet({
      __filename: "/virtual/prefix-protected.ts",
      prefix: "p",
    });

    shweet.c['attr[title=".fake, #fake"]'] = { color: "red" };
    shweet.c['attr[title=".fake"] .child'] = { color: "blue" };
    shweet.c['esc[title="a\\" .fake#fake"] .child'] = { color: "green" };
    shweet.c["commented/* .fake #fake */"] = { color: "orange" };

    const css = compile(shweet).css;

    expect(css).toContain('.p_attr[title=".fake, #fake"] {');
    expect(css).toContain('.p_attr[title=".fake"] .p_child {');
    expect(css).toContain('.p_esc[title="a\\" .fake#fake"] .p_child {');
    expect(css).toContain(".p_commented/* .fake #fake */ {");
  });

  test("preserves escaped identifier content while prefixing the token", () => {
    const shweet = new Shweet({
      __filename: "/virtual/prefix-escaped.ts",
      prefix: "p",
    });

    shweet.c["escaped\\.dot"] = { color: "red" };
    shweet.c["escaped\\#hash"] = { color: "blue" };

    const css = compile(shweet).css;

    expect(css).toContain(".p_escaped\\.dot {");
    expect(css).toContain(".p_escaped\\#hash {");
    // The escaped punctuation is part of the identifier and is not a marker.
    expect(css).not.toContain(".p_escaped\\.p_dot");
  });

  test("prefixes selector tokens after protected attribute content", () => {
    const shweet = new Shweet({
      __filename: "/virtual/prefix-after-attribute.ts",
      prefix: "x",
    });

    shweet.c['block[data-label=".fake"]:has(> .child, #direct)'] = {
      color: "red",
    };

    expect(compile(shweet).css).toContain(
      '.x_block[data-label=".fake"]:has(> .x_child, #x_direct) {',
    );
  });
});

describe("parent selector lists with nested suffixes", () => {
  test("applies pseudo suffixes to every parent selector", () => {
    const shweet = new Shweet({
      __filename: "/virtual/parent-list-suffix.ts",
      prefix: "p",
    });

    shweet.d[".a, .b"] = [
      { color: "red" },
      ps.hover()({ color: "blue" }),
      ps.and(".z")({ color: "black" }),
    ];

    const css = compile(shweet).css;

    expect(css).toContain(".p_a:hover, .p_b:hover {");
    expect(css).toContain(".p_a, .p_b, .p_z {");
    // Nested lists stay inside the functional pseudo argument.
    const nested = new Shweet({
      __filename: "/virtual/parent-list-functional.ts",
      prefix: "p",
    });
    nested.d[":is(.x, .y)"] = [
      { color: "red" },
      ps.hover()({ color: "blue" }),
    ];
    expect(compile(nested).css).toContain(":is(.p_x, .p_y):hover {");
  });

  test("does not split parent selector lists on commas inside comments", () => {
    const shweet = new Shweet({
      __filename: "/virtual/parent-list-comment.ts",
      prefix: "p",
    });

    shweet.d[".a/* keep, comma */, .b"] = [
      { color: "red" },
      ps.hover()({ color: "blue" }),
    ];

    const css = compile(shweet).css;

    expect(css).toContain(".p_a/* keep, comma */:hover, .p_b:hover {");
  });

  test("distributes combinators across parent and target lists", () => {
    const shweet = new Shweet({
      __filename: "/virtual/parent-list-combinator.ts",
      prefix: "p",
    });

    shweet.d[".a, .b"] = [
      { color: "red" },
      ps.desc(".c, .d")({ color: "blue" }),
      ps.child(".e")({ color: "green" }),
    ];

    const css = compile(shweet).css;

    expect(css).toContain(".p_a .p_c, .p_a .p_d, .p_b .p_c, .p_b .p_d {");
    expect(css).toContain(".p_a > .p_e, .p_b > .p_e {");
  });
});

describe("token-aware minification", () => {
  test("keeps ordinary minified output compact", () => {
    expect(minifyCss("\n.a, .b {\n  color: red;\n}\n")).toBe(
      ".a,.b{color:red;}",
    );
  });

  test("keeps descendant whitespace before pseudo selectors", () => {
    expect(minifyCss(".a :hover { color: red; }")).toBe(
      ".a :hover{color:red;}",
    );
    expect(minifyCss(".a ::before { color: red; }")).toBe(
      ".a ::before{color:red;}",
    );
    expect(minifyCss("div :is(.x, .y) { color: blue; }")).toBe(
      "div :is(.x,.y){color:blue;}",
    );
    // Spaces before a declaration colon are unusual but remain valid.
    expect(minifyCss(".a { color : red; }")).toBe(".a{color :red;}");
  });

  test("does not rewrite quoted strings or url payloads", () => {
    const url =
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'></svg>";
    const input = [
      ".a, .b {",
      '  content: "a ; b , c : d";',
      `  background: url("${url}");`,
      "}",
    ].join("\n");

    expect(minifyCss(input)).toBe(
      '.a,.b{content:"a ; b , c : d";background:url("' + url + '");}',
    );
  });

  test("preserves required whitespace in calc and related functions", () => {
    expect(
      minifyCss(
        ".a { width: calc(100% - 2px + var(--gap, 1px)); height: min(2rem, 5vh); }",
      ),
    ).toBe(
      ".a{width:calc(100% - 2px + var(--gap,1px));height:min(2rem,5vh);}",
    );
  });

  test("preserves custom property token content", () => {
    const input = [
      ".a {",
      '  --tokens: calc(100% - 2px) "a ; b";',
      "  color: red;",
      "}",
    ].join("\n");

    expect(minifyCss(input)).toBe(
      '.a{--tokens: calc(100% - 2px) "a ; b";color:red;}',
    );
  });

  test("preserves significant comments and removes ordinary comments safely", () => {
    const input = [
      "/*! license */",
      ".a {",
      "  color: red; /* remove me */",
      "}",
      ".a/* note */.b { color: blue; }",
      "a/**/b { color: green; }",
    ].join("\n");

    const result = minifyCss(input);

    expect(result).toContain("/*! license */");
    expect(result).not.toContain("remove me");
    expect(result).not.toContain("note");
    expect(result).toContain(".a.b{color:blue;}");
    expect(result).toContain("a b{color:green;}");
  });

  test("does not treat comment-like text inside strings as a comment", () => {
    expect(minifyCss('.a { content: "/* keep */"; }')).toBe(
      '.a{content:"/* keep */";}',
    );
  });
});
