import { describe, expect, test } from "bun:test";
import { f, ps, Shweet } from "../src";
import { Loader } from "../src/css";

const compile = (shweet: Shweet) => new Loader(shweet).load().css;

const createShweet = () =>
  new Shweet({ __filename: "/virtual/helpers-api.ts", prefix: "h" });

describe("ps selector helpers", () => {
  test("combinator helpers return nested keys appended to the parent", () => {
    expect(ps.child(".panel-title")({ fontSize: 1.5 })).toEqual({
      " > .panel-title": [{ fontSize: 1.5 }],
    });
    expect(ps.desc(".panel-body")({ color: "gray" })).toEqual({
      " .panel-body": [{ color: "gray" }],
    });
    expect(ps.next(".panel-step")({ marginTop: 0 })).toEqual({
      " + .panel-step": [{ marginTop: 0 }],
    });
    expect(ps.general(".panel-note")({ opacity: 0.5 })).toEqual({
      " ~ .panel-note": [{ opacity: 0.5 }],
    });
  });

  test("combinator helpers compose parent-child selectors without & syntax", () => {
    const shweet = createShweet();

    shweet.c.panel = [
      { padding: 2 },
      ps.child(".panel-title")({ fontSize: 1.5 }),
      ps.desc(".panel-body")({ color: "gray" }),
      ps.next(".panel-step")({ marginTop: 0 }),
      ps.general(".panel-note")({ opacity: 0.5 }),
    ];

    const css = compile(shweet);

    expect(css).toContain(".h_panel {");
    expect(css).toContain(".h_panel > .h_panel-title {");
    expect(css).toContain(".h_panel .h_panel-body {");
    expect(css).toContain(".h_panel + .h_panel-step {");
    expect(css).toContain(".h_panel ~ .h_panel-note {");
    expect(css).not.toContain("&");
  });

  test("combinator helpers expand top-level comma-separated targets", () => {
    const shweet = createShweet();

    shweet.c.panel = [
      { padding: 2 },
      ps.child(".title, .subtitle")({ fontSize: 1.5 }),
      ps.desc(".body, .footer")({ color: "gray" }),
      ps.next(".step, .step-alt")({ marginTop: 0 }),
      ps.general(".note, .note-alt")({ opacity: 0.5 }),
    ];

    const css = compile(shweet);

    expect(css).toContain(
      ".h_panel > .h_title, .h_panel > .h_subtitle {",
    );
    expect(css).toContain(".h_panel .h_body, .h_panel .h_footer {");
    expect(css).toContain(".h_panel + .h_step, .h_panel + .h_step-alt {");
    expect(css).toContain(".h_panel ~ .h_note, .h_panel ~ .h_note-alt {");
    expect(css).not.toContain("..");
  });

  test("combinator helpers keep nested commas and quotes intact", () => {
    const shweet = createShweet();

    shweet.c.panel = [
      { padding: 2 },
      ps.child(":is(.title, .subtitle)")({ fontSize: 1.5 }),
      ps.child('[data-label="a, b"], .plain')({ display: "grid" }),
    ];

    const css = compile(shweet);

    expect(css).toContain(
      ".h_panel > :is(.h_title, .h_subtitle) {",
    );
    expect(css).toContain(
      '.h_panel > [data-label="a, b"], .h_panel > .h_plain {',
    );
  });

  test("pseudo-class helpers return suffix keys for classes and functions", () => {
    expect(ps.hover()({ color: "red" })).toEqual({
      ":hover": [{ color: "red" }],
    });
    expect(ps.focusVisible()({ color: "red" })).toEqual({
      ":focus-visible": [{ color: "red" }],
    });
    expect(ps.is(".a, .b")({ color: "red" })).toEqual({
      ":is(.a, .b)": [{ color: "red" }],
    });
    expect(ps.not(".a")({ color: "red" })).toEqual({
      ":not(.a)": [{ color: "red" }],
    });
    expect(ps.has(".icon")({ color: "red" })).toEqual({
      ":has(.icon)": [{ color: "red" }],
    });
  });

  test("pseudo-class helpers append to the prefixed parent", () => {
    const shweet = createShweet();

    shweet.c.button = [
      { border: 0 },
      ps.hover()({ color: "white" }),
      ps.focusVisible()({ outline: "2px solid" }),
      ps.is(".button-primary, .button-secondary")({ fontWeight: "bold" }),
      ps.not(".button-disabled")({ cursor: "pointer" }),
      ps.has(".button-icon")({ gap: 1 }),
    ];

    const css = compile(shweet);

    expect(css).toContain(".h_button:hover {");
    expect(css).toContain(".h_button:focus-visible {");
    expect(css).toContain(
      ".h_button:is(.h_button-primary, .h_button-secondary) {",
    );
    expect(css).toContain(".h_button:not(.h_button-disabled) {");
    expect(css).toContain(".h_button:has(.h_button-icon) {");
  });

  test("attr appends an attribute selector and uses only the first entry", () => {
    const helper = ps.attr({ "data-state": "open", "data-extra": "ignored" });

    // Bounded behavior: the input object is not iterated beyond its first key.
    expect(helper({ display: "grid" })).toEqual({
      '[data-state="open"]': [{ display: "grid" }],
    });

    const shweet = createShweet();
    shweet.c.panel = [
      { padding: 2 },
      ps.attr({ "data-state": "open", "data-extra": "ignored" })({
        display: "grid",
      }),
    ];

    const css = compile(shweet);

    expect(css).toContain('.h_panel[data-state="open"] {');
    expect(css).not.toContain("data-extra");
  });
});

describe("f value helpers", () => {
  test("math and track builders return CSS function strings", () => {
    expect(f.calc("100% -", 2)).toBe("calc(100% - 2rem)");
    expect(f.clamp(1, 2, 3)).toBe("clamp(1rem, 2rem, 3rem)");
    expect(f.min(1, 2)).toBe("min(1rem, 2rem)");
    expect(f.minmax(0, "1fr")).toBe("minmax(0rem, 1fr)");
    expect(f.repeat(3, "1fr")).toBe("repeat(3, 1fr)");
  });

  test("gradient, color, transform, and filter builders return value strings", () => {
    expect(f.linearGradient("to right", "red", "blue")).toBe(
      "linear-gradient(to right, red, blue)",
    );
    expect(f.rgb(255, 0, 0)).toBe("rgb(255 0 0)");
    expect(f.rgba(0, 0, 0, 0.5)).toBe("rgba(0 0 0 / 0.5)");
    expect(f.colorMix("in srgb", "red", ["blue", "20%"])).toBe(
      "color-mix(in srgb, red, blue 20%)",
    );
    expect(f.translate(1, 2)).toBe("translate(1rem, 2rem)");
    expect(f.rotate(45)).toBe("rotate(45deg)");
    expect(f.blur(2)).toBe("blur(2rem)");
  });

  test("url and var builders return quoted references with camelCase vars", () => {
    expect(f.url("./image.png")).toBe("url('./image.png')");
    expect(f.var("brandColor")).toBe("var(--brand-color)");
    expect(f.var("brandColor", "red")).toBe("var(--brand-color, red)");
  });

  test("value builders survive declaration serialization", () => {
    const shweet = createShweet();

    shweet.c.box = {
      width: f.calc("100% -", 2),
      minWidth: f.min(10, 20),
      gap: f.clamp(1, 2, 3),
      backgroundImage: f.linearGradient("to right", "red", "blue"),
      backgroundColor: f.rgb(255, 0, 0),
      filter: f.blur(2),
      transform: f.translate(1, 2),
      listStyleImage: f.url("./image.png"),
      color: f.var("brandColor", "red"),
    };

    const css = compile(shweet);

    expect(css).toContain("width: calc(100% - 2rem);");
    expect(css).toContain("min-width: min(10rem, 20rem);");
    expect(css).toContain("gap: clamp(1rem, 2rem, 3rem);");
    expect(css).toContain(
      "background-image: linear-gradient(to right, red, blue);",
    );
    expect(css).toContain("background-color: rgb(255 0 0);");
    expect(css).toContain("filter: blur(2rem);");
    expect(css).toContain("transform: translate(1rem, 2rem);");
    expect(css).toContain("list-style-image: url('./image.png');");
    expect(css).toContain("color: var(--brand-color, red);");
  });
});
