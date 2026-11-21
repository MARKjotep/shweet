import { describe, expect, test } from "bun:test";
import { Shweet, type CSSValue } from "../src";
import { Loader } from "../src/css";

const compile = (declarations: Record<string, CSSValue>) => {
  const shweet = new Shweet({
    __filename: "/virtual/unitless-properties.ts",
  });
  shweet.c.a = declarations;
  return new Loader(shweet).load().css;
};

describe("unitless numeric properties", () => {
  test("lineHeight and fontWeight stay numeric", () => {
    const css = compile({ lineHeight: 1.5, fontWeight: 700 });

    expect(css).toContain("line-height: 1.5;");
    expect(css).toContain("font-weight: 700;");
    expect(css).not.toContain("line-height: 1.5rem;");
    expect(css).not.toContain("font-weight: 700rem;");
  });

  test("border-image numeric factors stay numeric", () => {
    const css = compile({
      borderImageOutset: 2,
      borderImageSlice: 1,
      borderImageWidth: 3,
    });

    expect(css).toContain("border-image-outset: 2;");
    expect(css).toContain("border-image-slice: 1;");
    expect(css).toContain("border-image-width: 3;");
  });

  test("border-image factor lists stay numeric", () => {
    const css = compile({
      borderImageSlice: [1, 2],
      borderImageWidth: [1, 2],
    });

    expect(css).toContain("border-image-slice: 1 2;");
    expect(css).toContain("border-image-width: 1 2;");
  });

  test("tabSize, zoom, orphans, and widows stay numeric", () => {
    const css = compile({ tabSize: 4, zoom: 1.5, orphans: 3, widows: 2 });

    expect(css).toContain("tab-size: 4;");
    expect(css).toContain("zoom: 1.5;");
    expect(css).toContain("orphans: 3;");
    expect(css).toContain("widows: 2;");
  });

  test("kebab-case keys receive the same unit handling", () => {
    const css = compile({
      "line-height": 1.5,
      "font-weight": 700,
      "tab-size": 4,
      "transition-duration": 2,
    });

    expect(css).toContain("line-height: 1.5;");
    expect(css).toContain("font-weight: 700;");
    expect(css).toContain("tab-size: 4;");
    expect(css).toContain("transition-duration: 2s;");
  });

  test("explicit string values are preserved", () => {
    const css = compile({
      lineHeight: "1.5",
      fontWeight: "bold",
      borderImageSlice: "fill",
      tabSize: "4",
    });

    expect(css).toContain("line-height: 1.5;");
    expect(css).toContain("font-weight: bold;");
    expect(css).toContain("border-image-slice: fill;");
    expect(css).toContain("tab-size: 4;");
    expect(css).not.toContain("rem");
  });
});

describe("unitful values are unchanged", () => {
  test("dimensional numbers still receive the default unit", () => {
    const css = compile({
      padding: 2,
      marginTop: 1,
      width: 10,
      borderBottomWidth: 2,
    });

    expect(css).toContain("padding: 2rem;");
    expect(css).toContain("margin-top: 1rem;");
    expect(css).toContain("width: 10rem;");
    expect(css).toContain("border-bottom-width: 2rem;");
  });

  test("time properties still serialize as seconds", () => {
    const css = compile({
      transitionDuration: 2,
      transitionDelay: 0.5,
      animationDuration: 3,
      animationDelay: 1,
    });

    expect(css).toContain("transition-duration: 2s;");
    expect(css).toContain("transition-delay: 0.5s;");
    expect(css).toContain("animation-duration: 3s;");
    expect(css).toContain("animation-delay: 1s;");
  });

  test("easing-function strings pass through unchanged", () => {
    const css = compile({
      animationTimingFunction: "ease-in-out",
      transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    });

    expect(css).toContain("animation-timing-function: ease-in-out;");
    expect(css).toContain(
      "transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);",
    );
  });
});

describe("serialized rule shape", () => {
  test("unitless and unitful declarations share one rule in order", () => {
    const css = compile({ lineHeight: 1.5, padding: 1, tabSize: 4 });

    expect(css).toContain(
      ".a {\n  line-height: 1.5; \n  padding: 1rem; \n  tab-size: 4;\n}",
    );
  });
});
