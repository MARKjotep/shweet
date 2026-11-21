import { describe, expect, test } from "bun:test";
import { Medyas, med, type MedyasOptions, type media } from "../src";

interface PresetData {
  tone: string;
}

/**
 * A reusable preset built the same way the QT reference subclasses are: every
 * getter writes one or more declarations through `_value` and returns `this`,
 * so getters can be chained and a media accessor can be inserted anywhere.
 */
class Preset extends Medyas<Preset, PresetData> {
  constructor(options: MedyasOptions<PresetData> = {}) {
    super({ data: { tone: "plain" }, ...options });
  }

  get base() {
    this._value = {
      display: "block",
      padding: 2,
      borderRadius: 1,
      backgroundColor: this.data.tone === "dark" ? "black" : "white",
    };
    return this;
  }

  get compact() {
    this._value = { padding: 1 };
    return this;
  }

  get outlined() {
    this._value = { border: "1px solid currentColor" };
    return this;
  }
}

describe("Medyas subclass presets", () => {
  test("preset getters write xs declarations and chain into media overrides", () => {
    const preset = new Preset().base;

    expect(preset.data).toEqual({ tone: "plain" });
    expect(preset._prefix).toBeUndefined();
    expect(preset._value.display?.xs).toBe("block");
    expect(preset._value.padding?.xs).toBe(2);
    expect(preset._value.borderRadius?.xs).toBe(1);
    expect(preset._value.backgroundColor?.xs).toBe("white");
    expect(preset._value.padding?.md).toBeUndefined();

    // `.MD` reuses the same declaration buckets and `.compact` only overrides
    // the md entry, leaving the xs base declarations untouched.
    const sharedValues = preset._value;
    const compact = preset.base.MD.compact;

    expect(compact._prefix).toBe("md");
    expect(compact._value).toBe(sharedValues);
    expect(compact._value.display?.xs).toBe("block");
    expect(compact._value.borderRadius?.xs).toBe(1);
    expect(compact._value.padding?.xs).toBe(2);
    expect(compact._value.padding?.md).toBe(1);
  });

  test("subclass data survives media accessor chaining", () => {
    const data = { tone: "dark" };
    const preset = new Preset({ data }).base.outlined.MD.compact;

    expect(preset.data).toBe(data);
    expect(preset._value.backgroundColor?.xs).toBe("black");
    expect(preset._value.border?.xs).toBe("1px solid currentColor");
    expect(preset._value.padding?.md).toBe(1);
  });

  test("MOBILE targets the mobile bucket instead of no_hover", () => {
    const mobile = new Preset().base.MOBILE.compact;

    expect(mobile._prefix).toBe("mobile");
    expect(mobile._value.padding?.xs).toBe(2);
    expect(mobile._value.padding?.mobile).toBe(1);
    expect(mobile._value.padding?.no_hover).toBeUndefined();
  });

  test("a prefix option applies to declarations set on that instance", () => {
    const preset = new Preset({ prefix: "md" }).base;

    expect(preset._value.padding?.md).toBe(2);
    expect(preset._value.padding?.xs).toBeUndefined();
  });
});

describe("Medyas constructor options", () => {
  test("defaults are safe when options are omitted or empty", () => {
    for (const instance of [new Medyas(), new Medyas({})]) {
      expect(instance.data).toEqual({});
      expect(instance._prefix).toBeUndefined();
      expect(instance._value).toEqual({});
    }
  });

  test("partial options only fill the supplied fields", () => {
    const prefixed = new Medyas({ prefix: "md" });
    expect(prefixed._prefix).toBe("md");
    expect(prefixed.data).toEqual({});

    const withData = new Medyas({ data: { id: 1 } });
    expect(withData.data).toEqual({ id: 1 });
    expect(withData._prefix).toBeUndefined();

    const withValues = new Medyas({ values: { padding: med({ xs: 1 }) } });
    expect(withValues._value.padding?.xs).toBe(1);
  });

  test("shared values are reused and user data is not replaced", () => {
    const values: Record<string, media> = { padding: med({ xs: 1 }) };
    const data = { id: 2 };
    const instance = new Medyas({ values, data });

    expect(instance._value).toBe(values);
    expect(instance.data).toBe(data);

    instance._value = { color: "red" };
    expect(values.padding?.xs).toBe(1);
    expect(values.color?.xs).toBe("red");
  });
});
