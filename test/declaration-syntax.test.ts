import { describe, expect, test } from "bun:test";
import { med, Shweet } from "../src";
import { Loader } from "../src/css";
import { Base } from "../src/css/selectors";
import { cssStringToObject } from "../src/css/selectors/proc/normalize";

const create = (prefix = "") =>
  new Shweet({ __filename: "/virtual/declaration-syntax.ts", prefix });

const compile = (shweet: Shweet) => new Loader(shweet).load().css;

const animationReferences = (shweet: Shweet): string[] => [
  ...(shweet.c as unknown as Base).ANIM.keys(),
];

describe("declaration string parsing", () => {
  test("splits declarations on top-level separators only", () => {
    expect(cssStringToObject("color: red; broken")).toEqual({ color: "red" });
    expect(cssStringToObject("color: red;; background: blue;")).toEqual({
      color: "red",
      background: "blue",
    });
    expect(cssStringToObject("width: calc(100% - 10px); color: red")).toEqual({
      width: "calc(100% - 10px)",
      color: "red",
    });
  });

  test("keeps quoted semicolons and colons intact", () => {
    const shweet = create();
    shweet.c.a = 'fontFamily: "A;B", sans-serif; color: red';

    const css = compile(shweet);
    expect(css).toContain('font-family: "A;B", sans-serif;');
    expect(css).toContain("color: red;");
  });

  test("honors escaped quotes inside quoted values", () => {
    const shweet = create();
    shweet.c.a = 'fontFamily: "A\\"B:C"; color: blue';

    const css = compile(shweet);
    expect(css).toContain('font-family: "A\\"B:C";');
    expect(css).toContain("color: blue;");
  });

  test("keeps separators inside functions and data URLs", () => {
    const shweet = create();
    shweet.c.a =
      "background: url(data:image/svg+xml;utf8,<svg></svg>); " +
      "gridTemplateColumns: repeat(2, minmax(0, 1fr)); color: red";

    const css = compile(shweet);
    expect(css).toContain(
      "background: url(data:image/svg+xml;utf8,<svg></svg>);",
    );
    expect(css).toContain(
      "grid-template-columns: repeat(2, minmax(0, 1fr));",
    );
    expect(css).toContain("color: red;");
  });

  test("preserves custom property names and token content", () => {
    const parsed = cssStringToObject("--Gap: 0");

    expect(parsed).toEqual({ "--Gap": "0" });

    const shweet = create();
    shweet.c.a =
      "--gap: 0; " +
      "--shadow: 0 0 10px rgba(0,0,0,.5); " +
      '--theme: {"bg": "red;blue"}; ' +
      "color: red";

    const css = compile(shweet);
    expect(css).toContain("--gap: 0;");
    expect(css).not.toContain("--gap: 0rem;");
    expect(css).toContain("--shadow: 0 0 10px rgba(0,0,0,.5);");
    expect(css).toContain('--theme: {"bg": "red;blue"};');
    expect(css).toContain("color: red;");
  });

  test("does not collapse interior value whitespace", () => {
    const shweet = create();
    shweet.c.a = "boxShadow: 0  0   10px red";

    expect(compile(shweet)).toContain("box-shadow: 0  0   10px red;");
  });

  test("converts only complete finite numeric literals", () => {
    const shweet = create();
    shweet.c.a =
      "width: 10; height: 10px; top: .5rem; opacity: 0.5; " +
      "zIndex: 2; flexGrow: 1.5; left: 0x10; right: Infinity";

    const css = compile(shweet);
    expect(css).toContain("width: 10rem;");
    expect(css).toContain("height: 10px;");
    expect(css).toContain("top: .5rem;");
    expect(css).toContain("opacity: 0.5;");
    expect(css).toContain("z-index: 2;");
    expect(css).toContain("flex-grow: 1.5;");
    // Hex and non-finite forms are not CSS numbers.
    expect(css).toContain("left: 0x10;");
    expect(css).toContain("right: Infinity;");
  });

  test("keeps the last write for repeated properties", () => {
    const shweet = create();
    shweet.c.a = "color: red; background: blue; color: green";

    const css = compile(shweet);
    expect(css.match(/color:/g)).toHaveLength(1);
    expect(css).toContain("color: green;");
    expect(css).toContain("background: blue;");
  });
});

describe("animation value prefixing", () => {
  test("prefixes names in spaced and unspaced comma lists", () => {
    const spaced = create("p");
    spaced.c.a = { animation: "bounce 2s infinite, slide 1s ease-in-out" };

    const spacedCss = compile(spaced);
    expect(spacedCss).toContain(
      "animation: p_bounce 2s infinite, p_slide 1s ease-in-out;",
    );
    expect(animationReferences(spaced)).toEqual(["p_bounce", "p_slide"]);

    const unspaced = create("p");
    unspaced.c.a = { animation: "bounce 2s,slide 1s" };

    expect(compile(unspaced)).toContain("animation: p_bounce 2s, p_slide 1s;");
  });

  test("does not prefix timing, easing, or other shorthand tokens", () => {
    const shweet = create("p");
    shweet.c.a = {
      animation: "2s cubic-bezier(0.1, 0.2, 0.3, 1) bounce both alternate",
    };

    const css = compile(shweet);
    expect(css).toContain(
      "animation: 2s cubic-bezier(0.1, 0.2, 0.3, 1) p_bounce both alternate;",
    );

    const keywords = create("p");
    keywords.c.a = { animation: "2s infinite alternate both paused" };

    expect(compile(keywords)).toContain(
      "animation: 2s infinite alternate both paused;",
    );
    expect(animationReferences(keywords)).toEqual([]);
  });

  test("handles a trailing importance flag", () => {
    const shweet = create("p");
    shweet.c.a = { animation: "bounce 2s !important" };

    expect(compile(shweet)).toContain("animation: p_bounce 2s !important;");
  });

  test("keeps commas inside function tokens in one animation", () => {
    const shweet = create("p");
    shweet.c.a = { animation: "bounce 1s steps(2, end) infinite" };

    expect(compile(shweet)).toContain(
      "animation: p_bounce 1s steps(2, end) infinite;",
    );
    expect(animationReferences(shweet)).toEqual(["p_bounce"]);
  });

  test("prefixes comma-separated animation names", () => {
    const shweet = create("p");
    shweet.c.a = { animationName: '"bounce", slide' };

    expect(compile(shweet)).toContain(
      'animation-name: "p_bounce", p_slide;',
    );
    expect(animationReferences(shweet)).toEqual(["p_bounce", "p_slide"]);
  });

  test("leaves ambiguous function values unchanged", () => {
    const shweet = create("p");
    shweet.c.a = { animation: "var(--motion)" };
    shweet.c.b = { animation: "bounce 2s var(--ease)" };
    shweet.c.d = { animationName: "var(--name)" };

    const css = compile(shweet);
    expect(css).toContain("animation: var(--motion);");
    expect(css).toContain("animation: bounce 2s var(--ease);");
    expect(css).toContain("animation-name: var(--name);");
    expect(animationReferences(shweet)).toEqual([]);
  });

  test("does not prefix animation-looking custom property values", () => {
    const shweet = create("p");
    shweet.c.a = "--motion: bounce 2s";

    expect(compile(shweet)).toContain("--motion: bounce 2s;");
    expect(animationReferences(shweet)).toEqual([]);
  });

  test("prefixes animation declarations parsed from strings", () => {
    const shweet = create("p");
    shweet.c.a = "animation: bounce 2s, slide 1s; color: red";

    const css = compile(shweet);
    expect(css).toContain("animation: p_bounce 2s, p_slide 1s;");
    expect(css).toContain("color: red;");
  });

  test("keeps keyframes referenced through function-containing values", () => {
    const shweet = create("p");
    shweet.kf.bounce = {
      from: { opacity: 0 },
      to: { opacity: 1 },
    };
    shweet.c.animated = { animation: "bounce 1s steps(2, end)" };
    shweet.c.other = { color: "blue" };

    const css = new Loader(shweet, ["animated"]).load().css;
    expect(css).toContain("@keyframes p_bounce");
    expect(css).not.toContain(".p_other");
  });

  test("does not mutate shared media or double-prefix on recompilation", () => {
    const shweet = create("p");
    const shared = med("bounce 2s, slide 1s");

    shweet.c.first = { animation: shared };
    shweet.c.second = { animation: shared };

    const first = compile(shweet);
    const second = compile(shweet);

    expect(shared.xs).toBe("bounce 2s, slide 1s");
    expect(first).toContain("animation: p_bounce 2s, p_slide 1s;");
    expect(first).not.toContain("p_p_");
    expect(second).toBe(first);
  });
});
