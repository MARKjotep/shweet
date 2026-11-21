/**
 * Manually invoked scaling diagnostics for Shweet selector/import graphs.
 *
 * Run with:
 *
 *   bun test/scaling-benchmarks.ts
 *
 * This script is intentionally not a test and is not discovered by `bun test`.
 * It builds a deterministic four-layer import chain at increasing selector
 * counts, compiles each graph several times, and reports median compile time,
 * output bytes, gzip bytes, and heap/RSS deltas.
 *
 * There are no thresholds, no pass/fail results, and no claims about asymptotic
 * complexity. Timings and memory figures are diagnostic only and depend on the
 * runtime, garbage collector, allocator, platform, and current machine load.
 *
 * Scope: only `Loader.load` is timed. Building the `Shweet` instances and
 * assigning declarations happens before each measurement window. Nothing is
 * written to disk, so no project or temporary artifacts are produced.
 */

import { gzipSync } from "node:zlib";
import { med, ps, Shweet, type CSSinR } from "../src";
import { Loader } from "../src/css";

const SIZES = [128, 256, 512, 1024] as const;
const LAYERS = 4;
const WARMUPS = 2;
const RUNS = 7;

/** Custom media feature declared by every graph layer and passed to `load`. */
const MEDIA_FEATURES = { standalone: "(display-mode: standalone)" };

/**
 * Authored top-level declarations per class: color, padding-top, padding-left,
 * margin-top, gap, z-index, and width. Some classes add hover/supports nesting;
 * those are counted when the graph is built.
 */
const BASE_DECLARATIONS = 7;

const palette = [
  "#1f2933",
  "#323f4b",
  "#3e4c59",
  "#52606d",
  "#616e7c",
  "#7b8794",
  "#9aa5b1",
  "#cbd2d9",
  "#e4e7eb",
  "#f5f7fa",
];

const color = (index: number): string =>
  palette[index % palette.length] as string;

interface GarbageCollector {
  run: () => void;
  label: string;
}

/**
 * Best-effort synchronous GC. `Bun.gc(true)` is available in Bun; the global
 * `gc` hook is only defined when Node runs with `--expose-gc`. When neither is
 * available the memory deltas include live garbage and are only directional.
 */
const detectGarbageCollector = (): GarbageCollector | undefined => {
  const runtime = globalThis as unknown as {
    Bun?: { gc?: (force?: boolean) => void };
    gc?: () => void;
  };

  if (typeof runtime.Bun?.gc === "function") {
    return {
      run: () => runtime.Bun?.gc?.(true),
      label: "Bun.gc(true)",
    };
  }

  if (typeof runtime.gc === "function") {
    return {
      run: () => runtime.gc?.(),
      label: "globalThis.gc()",
    };
  }

  return undefined;
};

interface Graph {
  root: Shweet;
  selectors: number;
  declarations: number;
  perLayer: number;
}

/**
 * Builds an explicit import chain: each layer imports the previous instance and
 * owns an equal share of the selectors. Prefixes keep selectors unique across
 * layers, while an ordinal-based declaration set keeps every rule unique so the
 * compiler cannot collapse them into one shared block.
 */
const buildGraph = (size: number): Graph => {
  const perLayer = Math.ceil(size / LAYERS);
  let root: Shweet | undefined;
  let selectors = 0;
  let declarations = 0;

  for (let layer = 0; layer < LAYERS; layer++) {
    const imported = root;
    const shweet = new Shweet({
      __filename: `/virtual/scaling-${size}-layer-${layer}.ts`,
      prefix: `scale${size}l${layer}`,
      mediaFeature: MEDIA_FEATURES,
      shweets: imported ? [imported] : [],
    });

    for (let index = 0; index < perLayer; index++) {
      const ordinal = layer * perLayer + index;
      const blocks: CSSinR[] = [
        {
          color:
            ordinal % 5 === 0
              ? med(color(ordinal), {
                  md: color(ordinal + 3),
                  lg: color(ordinal + 7),
                  standalone: color(ordinal + 9),
                })
              : color(ordinal),
          paddingTop: (ordinal % 29) + 0.25,
          paddingLeft: (ordinal % 17) + 0.5,
          marginTop: (ordinal % 13) + 0.75,
          gap: (ordinal % 11) + 1,
          zIndex: ordinal,
          width: `${(ordinal % 73) + 1}px`,
        },
      ];

      declarations += BASE_DECLARATIONS;

      if (ordinal % 7 === 0) {
        blocks.push(
          ps.hover()({
            backgroundColor: color(ordinal + 2),
          }) as CSSinR,
        );
        declarations += 1;
      }

      if (ordinal % 11 === 0) {
        blocks.push({
          outline: `${1 + (ordinal % 3)}px solid ${color(ordinal + 4)}`,
        });
        declarations += 1;
      }

      shweet.c[`s${index}`] = blocks;
      selectors += 1;
    }

    root = shweet;
  }

  // LAYERS is a positive constant, so the loop always assigns a root.
  return { root: root as Shweet, selectors, declarations, perLayer };
};

interface MemorySnapshot {
  heapUsed: number;
  rss: number;
}

const snapshot = (): MemorySnapshot => {
  const usage = process.memoryUsage();
  return { heapUsed: usage.heapUsed, rss: usage.rss };
};

interface Measurement {
  selectors: number;
  layers: number;
  perLayer: number;
  declarations: number;
  rawBytes: number;
  gzipBytes: number;
  minMs: number;
  medianMs: number;
  maxMs: number;
  before: MemorySnapshot;
  after: MemorySnapshot;
  stable: boolean;
}

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle] as number;
  }

  return ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
};

const measure = (
  size: number,
  gc: GarbageCollector | undefined,
): Measurement => {
  const graph = buildGraph(size);
  const loader = new Loader(graph.root);

  for (let run = 0; run < WARMUPS; run++) {
    loader.load(false, MEDIA_FEATURES);
  }

  // Establish a quieter baseline and drop warm-up garbage before sampling.
  gc?.run();
  const before = snapshot();

  const samples: number[] = [];
  let css = "";
  let stable = true;

  for (let run = 0; run < RUNS; run++) {
    const started = performance.now();
    const compiled = loader.load(false, MEDIA_FEATURES).css;
    samples.push(performance.now() - started);

    if (run === 0) {
      css = compiled;
    } else if (compiled !== css) {
      stable = false;
    }
  }

  // Retain only the final CSS string, then report the retained delta.
  gc?.run();
  const after = snapshot();

  return {
    selectors: graph.selectors,
    layers: LAYERS,
    perLayer: graph.perLayer,
    declarations: graph.declarations,
    rawBytes: Buffer.byteLength(css, "utf8"),
    gzipBytes: gzipSync(css).byteLength,
    minMs: Math.min(...samples),
    medianMs: median(samples),
    maxMs: Math.max(...samples),
    before,
    after,
    stable,
  };
};

const left = (value: string | number, width: number): string =>
  String(value).padEnd(width);

const right = (value: string | number, width: number): string =>
  String(value).padStart(width);

const mib = (bytes: number): string => (bytes / (1024 * 1024)).toFixed(2);

const signedMib = (bytes: number): string =>
  `${bytes >= 0 ? "+" : ""}${mib(bytes)}`;

const ratio = (current: number, previous: number): string =>
  previous === 0 ? "n/a" : (current / previous).toFixed(2);

const exponent = (current: number, previous: number, sizeRatio: number): string =>
  current <= 0 || previous <= 0 || sizeRatio <= 1
    ? "n/a"
    : (Math.log(current / previous) / Math.log(sizeRatio)).toFixed(2);

const printTimingTable = (rows: Measurement[]) => {
  const header = [
    left("selectors", 9),
    right("layers", 6),
    right("per layer", 9),
    right("authored decls", 14),
    right("raw B", 9),
    right("gzip B", 9),
    right("gzip %", 7),
    right("min ms", 8),
    right("median ms", 10),
    right("max ms", 8),
    right("stable", 6),
  ].join("  ");

  console.log(header);
  console.log("-".repeat(header.length));

  rows.forEach((row) => {
    const gzipPercent = ((row.gzipBytes / row.rawBytes) * 100).toFixed(1);
    console.log(
      [
        left(row.selectors, 9),
        right(row.layers, 6),
        right(row.perLayer, 9),
        right(row.declarations, 14),
        right(row.rawBytes, 9),
        right(row.gzipBytes, 9),
        right(`${gzipPercent}%`, 7),
        right(row.minMs.toFixed(2), 8),
        right(row.medianMs.toFixed(2), 10),
        right(row.maxMs.toFixed(2), 8),
        right(row.stable ? "yes" : "no", 6),
      ].join("  "),
    );
  });
};

const printMemoryTable = (rows: Measurement[]) => {
  const header = [
    left("selectors", 9),
    right("heap before", 12),
    right("heap after", 12),
    right("heap Δ", 10),
    right("rss before", 12),
    right("rss after", 12),
    right("rss Δ", 10),
  ].join("  ");

  console.log(header);
  console.log("-".repeat(header.length));

  rows.forEach((row) => {
    console.log(
      [
        left(row.selectors, 9),
        right(mib(row.before.heapUsed), 12),
        right(mib(row.after.heapUsed), 12),
        right(signedMib(row.after.heapUsed - row.before.heapUsed), 10),
        right(mib(row.before.rss), 12),
        right(mib(row.after.rss), 12),
        right(signedMib(row.after.rss - row.before.rss), 10),
      ].join("  "),
    );
  });
};

const printObservations = (rows: Measurement[]) => {
  console.log("Adjacent-size observations (diagnostic only, not a complexity claim)");

  for (let index = 1; index < rows.length; index++) {
    const previous = rows[index - 1] as Measurement;
    const current = rows[index] as Measurement;
    const sizeRatio = current.selectors / previous.selectors;

    console.log(
      `  ${previous.selectors} -> ${current.selectors} selectors: ` +
        `median x${ratio(current.medianMs, previous.medianMs)}, ` +
        `raw bytes x${ratio(current.rawBytes, previous.rawBytes)}, ` +
        `observed time exponent ${exponent(current.medianMs, previous.medianMs, sizeRatio)}, ` +
        `observed byte exponent ${exponent(current.rawBytes, previous.rawBytes, sizeRatio)}`,
    );
  }

  const first = rows[0];
  const last = rows[rows.length - 1];

  if (first && last && last !== first) {
    const sizeRatio = last.selectors / first.selectors;
    console.log(
      `  overall ${first.selectors} -> ${last.selectors} selectors: ` +
        `median x${ratio(last.medianMs, first.medianMs)}, ` +
        `raw bytes x${ratio(last.rawBytes, first.rawBytes)}, ` +
        `observed time exponent ${exponent(last.medianMs, first.medianMs, sizeRatio)}, ` +
        `observed byte exponent ${exponent(last.rawBytes, first.rawBytes, sizeRatio)}`,
    );
  }
};

const main = () => {
  const runtime = [
    `bun ${process.versions.bun ?? "unknown"}`,
    `process ${process.version}`,
    `${process.platform} ${process.arch}`,
    `v8 ${process.versions.v8 ?? "unknown"}`,
  ].join(" | ");

  const gc = detectGarbageCollector();

  console.log("Shweet scaling diagnostics (manual, non-gating)");
  console.log(`Runtime: ${runtime}`);
  console.log(
    `Graph: deterministic ${LAYERS}-layer import chain; each layer imports the previous instance`,
  );
  console.log(
    `Sizes: ${SIZES.join(", ")} selectors, with unique prefixed selectors and ordinal-based declarations`,
  );
  console.log(
    `Work: ${WARMUPS} warm-up + ${RUNS} measured Loader.load call(s) per size`,
  );
  console.log(
    `GC between memory windows: ${gc ? gc.label : "not available; deltas include live garbage"}`,
  );
  console.log(
    "Scope: Loader.load only; instance construction and assignments are excluded",
  );
  console.log(
    "Caveats: timings and memory are diagnostic, GC/platform-dependent, and vary by machine",
  );
  console.log(
    "No thresholds, pass/fail claims, or assertions about linear/quadratic behavior",
  );
  console.log("");

  const rows = SIZES.map((size) => measure(size, gc));

  printTimingTable(rows);
  console.log("");
  console.log("Memory windows (MiB, after best-effort GC; retained delta only)");
  printMemoryTable(rows);
  console.log("");
  printObservations(rows);
  console.log("");
  console.log(
    "Ratios and exponents are single-machine observations, not guarantees or thresholds.",
  );
};

main();
