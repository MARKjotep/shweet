import { Property } from ".";
import { Var, f, med } from "../..";
import { expect, test, describe } from "bun:test";

describe("css Property", () => {
  // -------------------------

  test("no rems", () => {
    //
    expect(Property("zIndex", 1)).toBe("z-index: 1;");
    expect(Property("opacity", 1)).toBe("opacity: 1;");
    expect(Property("webkitLineClamp", 1)).toBe("-webkit-line-clamp: 1;");
  });

  test("unit properties", () => {
    //
    expect(Property("padding", 1)).toBe("padding: 1rem;");
    expect(Property("padding", 1, "em")).toBe("padding: 1em;");
  });

  test("quote", () => {
    //
    expect(Property("content", "")).toBe("content: '';");
  });

  test("value separated by comma", () => {
    //
    expect(Property("transitionProperty", [1, 2, 3, 4])).toBe(
      "transition-property: 1rem, 2rem, 3rem, 4rem;",
    );
  });

  test("seconds", () => {
    //
    expect(Property("transitionDuration", 1)).toBe("transition-duration: 1s;");
  });
});

describe("css Property edge cases", () => {
  test("empty values", () => {
    expect(Property("margin", "")).toBe("margin: ;");
    expect(Property("padding", null as any)).toBe("padding: ;");
    expect(Property("width", undefined)).toBe("width: ;");
  });

  test("custom units", () => {
    expect(Property("width", 50, "%")).toBe("width: 50%;");
    expect(Property("height", 100, "vh")).toBe("height: 100vh;");
    expect(Property("fontSize", 16, "px")).toBe("font-size: 16px;");
  });

  test("zero values", () => {
    expect(Property("margin", 0)).toBe("margin: 0rem;");
    expect(Property("padding", 0, "px")).toBe("padding: 0px;");
  });

  test("negative values", () => {
    expect(Property("marginTop", -1)).toBe("margin-top: -1rem;");
    expect(Property("left", -50, "%")).toBe("left: -50%;");
  });

  test("decimal values", () => {
    expect(Property("opacity", 0.5)).toBe("opacity: 0.5;");
    expect(Property("scale", 1.5)).toBe("scale: 1.5;");
  });

  test("multiple word properties", () => {
    expect(Property("backgroundColor", "#fff")).toBe("background-color: #fff;");
    expect(Property("borderBottomWidth", 2)).toBe("border-bottom-width: 2rem;");
  });
});
