/**
 * Manually invoked diagnostics for representative Shweet inputs.
 *
 * Run with:
 *
 *   bun test/benchmarks.ts
 *
 * This script is intentionally not a test. It reports raw/gzip output bytes,
 * compile duration, and heap/RSS figures for deterministic synthetic inputs.
 * It has no thresholds and makes no pass/fail claims. The only file output is a
 * temporary directory that is removed before the script exits.
 *
 * Timing covers `Loader.load` only. Building the Shweet instances (assignments)
 * happens before each measurement and is not included.
 */

import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { med, ps, Shweet, supports } from "../src";
import { Loader } from "../src/css";

const WARMUPS = 1;
const RUNS = 5;

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

interface Scenario {
  name: string;
  build: () => Shweet;
  mediaFeatures?: Record<string, unknown>;
}

const plainSelectors = (): Shweet => {
  const shweet = new Shweet({
    __filename: "/virtual/benchmark-plain.ts",
    prefix: "plain",
  });

  for (let index = 0; index < 320; index++) {
    shweet.c[`plain-${index}`] = {
      color: color(index),
      padding: (index % 5) + 1,
      margin: index % 3,
      display: index % 2 === 0 ? "block" : "flex",
      gap: index % 4,
    };
  }

  return shweet;
};

const conditionalRules = (): Shweet => {
  const shweet = new Shweet({
    __filename: "/virtual/benchmark-conditional.ts",
    prefix: "cond",
    mediaFeature: { standalone: "(display-mode: standalone)" },
  });

  for (let index = 0; index < 160; index++) {
    shweet.c[`cond-${index}`] = [
      {
        color: med(color(index), {
          md: color(index + 1),
          lg: color(index + 2),
          standalone: color(index + 3),
        }),
      },
      ps.hover()({ backgroundColor: color(index + 3) }),
      ps.focusVisible()({ outline: `${1 + (index % 3)}px solid currentColor` }),
      supports({ display: "grid" })({
        display: "grid",
        gridTemplateColumns: `repeat(${1 + (index % 4)}, minmax(0, 1fr))`,
      }),
    ];
  }

  return shweet;
};

const animationGraph = (): Shweet => {
  const shweet = new Shweet({
    __filename: "/virtual/benchmark-animation.ts",
    prefix: "anim",
  });

  for (let index = 0; index < 12; index++) {
    shweet.kf[`motion-${index}`] = {
      from: { opacity: 0, transform: `translateY(${index}px)` },
      "50%": { opacity: 0.5 },
      to: { opacity: 1, transform: "translateY(0)" },
    };
  }

  for (let index = 0; index < 180; index++) {
    const name = `motion-${index % 12}`;
    shweet.c[`anim-${index}`] =
      index % 4 === 0
        ? {
            animation: `${name} ${1 + (index % 3)}s ease-in-out infinite, motion-${(index + 1) % 12} ${2 + (index % 2)}s linear`,
          }
        : {
            animationName: name,
            animationDuration: `${1 + (index % 3)}s`,
          };
  }

  return shweet;
};

const buildComposed = (layers = 4, classesPerLayer = 60): Shweet => {
  let root: Shweet | undefined;

  for (let layer = 0; layer < layers; layer++) {
    const imported = root;
    const shweet = new Shweet({
      __filename: `/virtual/benchmark-layer-${layer}.ts`,
      prefix: `layer${layer}`,
      shweets: imported ? [imported] : [],
    });

    for (let index = 0; index < classesPerLayer; index++) {
      shweet.c[`layer-${layer}-${index}`] = {
        color: color(index + layer),
        padding: (index % 4) + 1,
        margin: index % 3,
        borderColor: color(index + layer + 1),
      };
    }

    root = shweet;
  }

  // `layers` is a positive constant, so the loop always creates a root.
  return root as Shweet;
};

const scenarios: Scenario[] = [
  { name: "plain selectors (320)", build: plainSelectors },
  {
    name: "conditional (160)",
    build: conditionalRules,
    mediaFeatures: { standalone: "(display-mode: standalone)" },
  },
  { name: "animation (180, 12 kf)", build: animationGraph },
  { name: "composed (4x60)", build: () => buildComposed() },
];

interface Measurement {
  name: string;
  rawBytes: number;
  gzipBytes: number;
  minMs: number;
  medianMs: number;
  maxMs: number;
  rssDelta: number;
  heapDelta: number;
}

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] as number;
};

const measure = (scenario: Scenario): Measurement => {
  const shweet = scenario.build();

  for (let run = 0; run < WARMUPS; run++) {
    new Loader(shweet).load(false, scenario.mediaFeatures ?? {});
  }

  const before = process.memoryUsage();
  const samples: number[] = [];
  let css = "";

  for (let run = 0; run < RUNS; run++) {
    const started = performance.now();
    css = new Loader(shweet).load(false, scenario.mediaFeatures ?? {}).css;
    samples.push(performance.now() - started);
  }

  const after = process.memoryUsage();

  return {
    name: scenario.name,
    rawBytes: Buffer.byteLength(css, "utf8"),
    gzipBytes: gzipSync(css).byteLength,
    minMs: Math.min(...samples),
    medianMs: median(samples),
    maxMs: Math.max(...samples),
    rssDelta: after.rss - before.rss,
    heapDelta: after.heapUsed - before.heapUsed,
  };
};

const pad = (value: string | number, width: number): string =>
  String(value).padStart(width);

const padEnd = (value: string, width: number): string =>
  String(value).padEnd(width);

const mib = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(2)}`;

const signedMib = (bytes: number): string =>
  `${bytes >= 0 ? "+" : ""}${mib(bytes)}`;

const printTable = (rows: Measurement[]) => {
  const header = [
    padEnd("scenario", 26),
    pad("raw B", 10),
    pad("gzip B", 9),
    pad("gzip %", 7),
    pad("min ms", 8),
    pad("median ms", 10),
    pad("max ms", 8),
    pad("rss Δ MiB", 10),
    pad("heap Δ MiB", 11),
  ].join(" ");

  console.log(header);
  console.log("-".repeat(header.length));

  rows.forEach((row) => {
    const ratio = ((row.gzipBytes / row.rawBytes) * 100).toFixed(1);
    console.log(
      [
        padEnd(row.name, 26),
        pad(row.rawBytes, 10),
        pad(row.gzipBytes, 9),
        pad(`${ratio}%`, 7),
        pad(row.minMs.toFixed(2), 8),
        pad(row.medianMs.toFixed(2), 10),
        pad(row.maxMs.toFixed(2), 8),
        pad(signedMib(row.rssDelta), 10),
        pad(signedMib(row.heapDelta), 11),
      ].join(" "),
    );
  });
};

const saveDiagnostic = () => {
  const directory = mkdtempSync(join(tmpdir(), "shweet-benchmark-"));
  const shweet = buildComposed();

  try {
    const started = performance.now();
    shweet.save({ dir: directory, name: "benchmark" });
    const duration = performance.now() - started;
    const css = readFileSync(join(directory, "benchmark.css"), "utf8");

    return {
      duration,
      rawBytes: Buffer.byteLength(css, "utf8"),
      gzipBytes: gzipSync(css).byteLength,
    };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
};

const main = () => {
  const runtime = [
    `bun ${process.versions.bun ?? "unknown"}`,
    `process ${process.version}`,
    `${process.platform} ${process.arch}`,
    `v8 ${process.versions.v8 ?? "unknown"}`,
  ].join(" | ");

  console.log("Shweet input/compile diagnostics");
  console.log(`Runtime: ${runtime}`);
  console.log(
    "Inputs: deterministic synthetic assignments (no random or clock-dependent data)",
  );
  console.log(
    `Runs: ${WARMUPS} warm-up + ${RUNS} measured compile(s) per scenario`,
  );
  console.log(
    "Scope: Loader.load only; instance construction and assignments are excluded",
  );
  console.log(
    "No thresholds or pass/fail claims. Memory deltas are observational.",
  );
  console.log("");

  const rows = scenarios.map(measure);
  printTable(rows);

  const saved = saveDiagnostic();
  console.log("");
  console.log("Save round-trip (temp directory, minified, removed afterwards)");
  console.log(
    `  composed (4x60): raw ${saved.rawBytes} B, gzip ${saved.gzipBytes} B, ` +
      `duration ${saved.duration.toFixed(2)} ms`,
  );
};

main();
