import { describe, expect, spyOn, test } from "bun:test";
import { Shweet, supports, type CompileDiagnostic } from "../src";
import { Loader } from "../src/css";

const internalImports = (handler: unknown): unknown[] =>
  (handler as { IMPORTED: unknown[] }).IMPORTED;

const compile = (
  shweet: Shweet,
  onDiagnostic?: (diagnostic: CompileDiagnostic) => void,
) => new Loader(shweet, [], [], onDiagnostic).load(false);

const collect = (shweet: Shweet): CompileDiagnostic[] => {
  const diagnostics: CompileDiagnostic[] = [];
  compile(shweet, (diagnostic) => diagnostics.push(diagnostic));
  return diagnostics;
};

const keyframesWithSupports = (path: string, prefix: string) => {
  const shweet = new Shweet({ __filename: path, prefix });
  shweet.kf.spin = {
    from: supports({ display: "grid" })({ opacity: 0 }) as never,
    to: { opacity: 1 },
  };
  return shweet;
};

describe("keyframe supports diagnostics", () => {
  test("reports the offending keyframe rule and step with a stable shape", () => {
    const shweet = keyframesWithSupports("/virtual/diagnostics/kf.ts", "kf");
    const diagnostics = collect(shweet);

    expect(diagnostics).toEqual([
      {
        code: "keyframes.supports-unsupported",
        severity: "error",
        message: "@supports is not supported in @keyframes",
        sourcePath: "/virtual/diagnostics/kf.ts",
        rule: "@keyframes kf_spin",
        selector: "from",
      },
    ]);

    // The unsupported step is still dropped exactly as before; the diagnostic
    // only makes that loss visible.
    const { css } = compile(shweet, () => {});
    expect(css).toContain("@keyframes kf_spin {");
    expect(css).not.toContain("from {");
  });

  test("names the imported originating file, not the root saver", () => {
    const base = keyframesWithSupports(
      "/virtual/diagnostics/imported-keyframes.ts",
      "base",
    );

    const diagnostics: CompileDiagnostic[] = [];
    const parent = new Shweet({
      __filename: "/virtual/diagnostics/root.ts",
      prefix: "root",
      shweets: [base],
      onDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
    });

    // The root instance option is used even when the loader is constructed
    // without an explicit callback.
    new Loader(parent).load(false);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      code: "keyframes.supports-unsupported",
      severity: "error",
      sourcePath: "/virtual/diagnostics/imported-keyframes.ts",
      rule: "@keyframes base_spin",
      selector: "from",
    });
  });

  test("a per-compilation callback overrides the root instance callback", () => {
    const shweet = keyframesWithSupports("/virtual/diagnostics/override.ts", "o");
    const instanceDiagnostics: CompileDiagnostic[] = [];
    const compileDiagnostics: CompileDiagnostic[] = [];

    shweet.onDiagnostic = (diagnostic) => instanceDiagnostics.push(diagnostic);

    compile(shweet, (diagnostic) => compileDiagnostics.push(diagnostic));

    expect(instanceDiagnostics).toEqual([]);
    expect(compileDiagnostics).toHaveLength(1);
    expect(compileDiagnostics[0]?.sourcePath).toBe(
      "/virtual/diagnostics/override.ts",
    );
  });

  test("default console logging is preserved when no callback is supplied", () => {
    const shweet = keyframesWithSupports("/virtual/diagnostics/log.ts", "log");
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});

    try {
      compile(shweet);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0]).toEqual([
        "@supports not supported in @keyframes",
        { error: "support in keyframes" },
      ]);
    } finally {
      errorSpy.mockRestore();
    }
  });

  test("a supplied callback replaces the default console logging", () => {
    const shweet = keyframesWithSupports("/virtual/diagnostics/silent.ts", "s");
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});

    try {
      const diagnostics = collect(shweet);

      expect(diagnostics).toHaveLength(1);
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });
});

describe("import cycle diagnostics", () => {
  test("reports real cycles with source paths and still terminates", () => {
    const first = new Shweet({
      __filename: "/virtual/diagnostics/cycle-a.ts",
      prefix: "cycle",
    });
    first.c.one = { color: "red" };
    first.kf.spin = {
      from: { opacity: 0 },
      to: { opacity: 1 },
    };

    const second = new Shweet({
      __filename: "/virtual/diagnostics/cycle-b.ts",
      prefix: "other",
    });
    second.c.two = { color: "blue" };

    // Cycles cannot be produced through the `shweets` constructor. These links
    // exercise the defensive guards for unsupported internal mutation.
    internalImports(first.c).push(second.c);
    internalImports(second.c).push(first.c);
    internalImports(first.kf).push(first.kf);

    const diagnostics = collect(first);

    const cidCycle = diagnostics.find(
      (diagnostic) =>
        diagnostic.code === "import.cycle" &&
        diagnostic.message.includes("cycle-b.ts"),
    );
    const keyframeCycle = diagnostics.find(
      (diagnostic) =>
        diagnostic.code === "import.cycle" &&
        !diagnostic.message.includes("cycle-b.ts"),
    );

    expect(cidCycle).toEqual({
      code: "import.cycle",
      severity: "warning",
      message:
        "Circular import detected: /virtual/diagnostics/cycle-a.ts -> /virtual/diagnostics/cycle-b.ts -> /virtual/diagnostics/cycle-a.ts",
      sourcePath: "/virtual/diagnostics/cycle-a.ts",
    });
    expect(keyframeCycle).toEqual({
      code: "import.cycle",
      severity: "warning",
      message:
        "Circular import detected: /virtual/diagnostics/cycle-a.ts -> /virtual/diagnostics/cycle-a.ts",
      sourcePath: "/virtual/diagnostics/cycle-a.ts",
    });

    // Output remains deterministic and identical to the callback-free path.
    const withCallback = compile(first).css;
    const withoutCallback = new Loader(first).load(false).css;
    expect(withCallback).toBe(withoutCallback);
    expect(compile(first).css).toBe(withCallback);
    expect(withCallback.split(".cycle_one {")).toHaveLength(2);
    expect(withCallback.split(".other_two {")).toHaveLength(2);
    expect(withCallback.split("@keyframes cycle_spin")).toHaveLength(2);
  });

  test("repeated same-object imports are deduplicated without diagnostics", () => {
    const base = new Shweet({
      __filename: "/virtual/diagnostics/duplicate-base.ts",
      prefix: "base",
    });
    base.c.shared = { color: "red" };
    base.kf.pulse = { from: { opacity: 0 }, to: { opacity: 1 } };
    base.c.animated = { animation: "pulse 1s" };

    const middle = new Shweet({
      __filename: "/virtual/diagnostics/duplicate-middle.ts",
      prefix: "middle",
      shweets: [base, base],
    });
    middle.c.own = { color: "blue" };

    const top = new Shweet({
      __filename: "/virtual/diagnostics/duplicate-top.ts",
      prefix: "top",
      shweets: [middle, base, base],
    });
    top.c.local = { color: "green" };

    const diagnostics = collect(top);

    expect(diagnostics).toEqual([]);
    const { css } = compile(top);
    expect(css.split(".base_shared {")).toHaveLength(2);
    expect(css.split("@keyframes base_pulse")).toHaveLength(2);
  });

  test("distinct instances sharing a source path are valid, not cycles", () => {
    const first = new Shweet({
      __filename: "/virtual/diagnostics/shared-path.ts",
      prefix: "one",
    });
    first.c.shared = { padding: 1 };

    const second = new Shweet({
      __filename: "/virtual/diagnostics/shared-path.ts",
      prefix: "two",
    });
    second.c.shared = { padding: 2 };

    const parent = new Shweet({
      __filename: "/virtual/diagnostics/shared-parent.ts",
      prefix: "parent",
      shweets: [first, second, first],
    });
    parent.c.own = { padding: 3 };

    const diagnostics = collect(parent);

    expect(diagnostics).toEqual([]);
    const { css } = compile(parent);
    expect(css).toContain(".one_shared {");
    expect(css).toContain(".two_shared {");
    expect(css.split(".one_shared {")).toHaveLength(2);
  });
});

describe("malformed diagnostic callbacks", () => {
  test("a throwing callback cannot abort or alter CSS collection", () => {
    const shweet = keyframesWithSupports(
      "/virtual/diagnostics/throwing.ts",
      "throwing",
    );
    shweet.c.ok = { color: "green" };

    const baseline = new Loader(shweet, [], [], () => {}).load(false).css;
    const diagnostics: CompileDiagnostic[] = [];

    const loader = new Loader(shweet, [], [], (diagnostic) => {
      diagnostics.push(diagnostic);
      throw new Error("consumer callback failure");
    });

    expect(() => loader.load(false)).not.toThrow();
    expect(loader.css).toBe(baseline);
    expect(diagnostics).toHaveLength(1);
  });

  test("a non-function callback falls back to the previous behavior", () => {
    const shweet = keyframesWithSupports(
      "/virtual/diagnostics/non-function.ts",
      "nonfn",
    );
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});

    try {
      const loader = new Loader(
        shweet,
        [],
        [],
        null as unknown as (diagnostic: CompileDiagnostic) => void,
      );

      expect(() => loader.load(false)).not.toThrow();
      expect(loader.css).toContain("@keyframes nonfn_spin {");
      expect(errorSpy).toHaveBeenCalledTimes(1);
    } finally {
      errorSpy.mockRestore();
    }
  });
});
