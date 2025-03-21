import { Value } from ".";
import { Var, f, med } from "../..";
import { expect, test, describe } from "bun:test";

describe("property value", () => {
  // -------------------------

  const VALUnit = (unit?: string) => {
    return expect(Value(1, { rem: true, unit }));
  };
  test("units", () => {
    //
    VALUnit().toBe("1rem");
    VALUnit("em").toBe("1em");
    VALUnit("px").toBe("1px");
    VALUnit("pt").toBe("1pt");
    expect(Value("1", { rem: true })).toBe("1");
  });

  test("degree", () => {
    //
    expect(Value(1, { degree: true })).toBe("1deg");
  });

  test("percent", () => {
    //
    expect(Value(1, { percent: true })).toBe("1%");
  });

  test("second", () => {
    //
    expect(Value(1, { second: true })).toBe("1s");
  });

  test("hierarchy", () => {
    //
    expect(Value(1, { rem: true, degree: true })).toBe("1rem");
  });

  test("quote", () => {
    //
    expect(Value("quote me", { quote: true })).toBe("'quote me'");
  });

  test("var", () => {
    //
    const va = Var({ va: 123 }, 567);
    expect(Value(va)).toBe("var(--va, 567)");
    expect(Value(va.new(789, 567))).toBe("var(--va, 567)");
    expect(Value(va.new(999))).toBe("var(--va)");
  });

  test("css function", () => {
    //
    expect(Value(f.calc(1, "+", 3), { rem: true })).toBe("calc(1rem + 3rem)");
  });

  test("media in value", () => {
    //
    expect(Value(med(1, {}) as any, { rem: true })).toBe("");
  });

  test("arrays", () => {
    //
    expect(Value([1, 2, 3], { rem: true })).toBe("1rem 2rem 3rem");
    expect(
      Value(
        [
          [1, 2],
          [3, 4],
        ],
        { rem: true },
      ),
    ).toBe("1rem 2rem, 3rem 4rem");
  });
});

describe("property value generated", () => {
  test("null and undefined values", () => {
    expect(Value(null)).toBe("");
    expect(Value(undefined)).toBe("");
  });

  test("mixed array types", () => {
    expect(Value([1, "2px", "calc(3 + 4)"], { rem: true })).toBe(
      "1rem 2px calc(3 + 4)",
    );
    expect(Value([null, 1, undefined, 2], { rem: true })).toBe("1rem 2rem");
  });

  test("nested arrays with different delimeters", () => {
    expect(
      Value(
        [
          [1, 2],
          [3, 4],
        ],
        { rem: true, delimeter: " | ", delimeter_arr: " -> " },
      ),
    ).toBe("1rem 2rem -> 3rem 4rem");
  });

  test("custom unit with different value types", () => {
    expect(Value([1, "auto", "inherit"], { rem: true, unit: "vh" })).toBe(
      "1vh auto inherit",
    );
    expect(Value(["100", 200, "max-content"], { rem: true, unit: "vw" })).toBe(
      "100 200vw max-content",
    );
  });

  test("string values with parentheses", () => {
    expect(Value("min(100px, 50%)")).toBe("min(100px, 50%)");
    expect(Value("clamp(1rem, 2vw, 3rem)")).toBe("clamp(1rem, 2vw, 3rem)");
  });

  test("empty string and array values", () => {
    expect(Value("")).toBe("");
    expect(Value([])).toBe("");
    expect(Value([[], []])).toBe("");
  });

  test("mixed nested arrays with empty values", () => {
    expect(
      Value(
        [
          [1, ""],
          [null, 2],
        ],
        { rem: true },
      ),
    ).toBe("1rem, 2rem");
    expect(Value([[], [1], [undefined, 2]], { percent: true })).toBe("1%, 2%");
  });
});
