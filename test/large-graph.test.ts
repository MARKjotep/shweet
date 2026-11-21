import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { med, ps, Shweet, type CSSinR } from "../src";
import { Loader } from "../src/css";

/**
 * Bounded graph size: four import layers with forty independent classes each.
 * The test asserts determinism and isolation, not speed or output size, so it
 * deliberately avoids performance thresholds.
 */
const LAYERS = 4;
const CLASSES_PER_LAYER = 40;
const MEDIA_FEATURES = { surface: "(display-mode: standalone)" };

const palette = [
  "#1f2933",
  "#323f4b",
  "#3e4c59",
  "#52606d",
  "#616e7c",
  "#7b8794",
  "#9aa5b1",
  "#cbd2d9",
];

const color = (index: number): string =>
  palette[index % palette.length] as string;

const temporaryDirectories: string[] = [];

const temporaryDirectory = (name: string) => {
  const directory = mkdtempSync(join(tmpdir(), `shweet-${name}-`));
  temporaryDirectories.push(directory);
  return directory;
};

afterAll(() => {
  temporaryDirectories.forEach((directory) => {
    rmSync(directory, { recursive: true, force: true });
  });
});

/**
 * Builds a deterministic import chain. Each layer imports the previous one and
 * owns forty class rules. Layer 0 defines two keyframes; one retained class
 * references one of them.
 */
const buildGraph = (label: string, prefix: string): Shweet => {
  let root: Shweet | undefined;

  for (let layer = 0; layer < LAYERS; layer++) {
    const imported = root;
    const shweet = new Shweet({
      __filename: `/virtual/${label}-layer-${layer}.ts`,
      prefix: `${prefix}${layer}`,
      mediaFeature: MEDIA_FEATURES,
      shweets: imported ? [imported] : [],
    });

    if (layer === 0) {
      shweet.kf.slide = {
        from: { opacity: 0 },
        to: { opacity: 1 },
      };
      shweet.kf.idle = {
        from: { opacity: 1 },
        to: { opacity: 0 },
      };
    }

    for (let index = 0; index < CLASSES_PER_LAYER; index++) {
      const blocks: CSSinR[] = [
        {
          color:
            index % 5 === 0
              ? med(color(index), {
                  md: color(index + 1),
                  lg: color(index + 2),
                  ...(index % 10 === 0
                    ? { surface: color(index + 4) }
                    : {}),
                })
              : color(index),
          padding: (index % 3) + 1,
          margin: index % 4,
        },
      ];

      if (index % 7 === 0) {
        blocks.push(
          ps.hover()({
            backgroundColor: color(index),
          }) as CSSinR,
        );
      }

      if (layer === 0 && index === 0) {
        blocks.push({ animation: "slide 1s" });
      }

      shweet.c[`c${index}`] = blocks;
    }

    root = shweet;
  }

  // LAYERS is a positive constant, so the loop always assigns a root.
  return root as Shweet;
};

const compile = (
  shweet: Shweet,
  exportMap: boolean = false,
  mediaFeatures: Record<string, unknown> = {},
) => new Loader(shweet).load(exportMap, mediaFeatures);

const mapEntries = (loader: Loader) =>
  [...loader.CID.entries()].map(([key, values]) => [key, [...values]] as const);

describe("bounded large selector and import graph", () => {
  test("repeated compiles are deterministic across the import chain", () => {
    const graph = buildGraph("deterministic", "d");

    const first = compile(graph, true, MEDIA_FEATURES);
    const second = compile(graph, true, MEDIA_FEATURES);
    const third = compile(graph, true, MEDIA_FEATURES);

    expect(second.css).toBe(first.css);
    expect(third.css).toBe(first.css);
    expect(mapEntries(second)).toEqual(mapEntries(first));
    expect(mapEntries(third)).toEqual(mapEntries(first));

    for (let layer = 0; layer < LAYERS; layer++) {
      for (let index = 0; index < CLASSES_PER_LAYER; index++) {
        expect(first.css).toContain(`.d${layer}_c${index}`);
      }
    }

    expect(first.css).toContain("@keyframes d0_slide");
    expect(first.css).toContain("@keyframes d0_idle");
    expect(first.css).toContain("@media (display-mode: standalone)");
    expect(first.css).toContain("@media (min-width: 768px)");

    // Every layer contributes the same unprefixed class names to the map.
    expect([...first.CID.keys()].sort()).toEqual(
      Array.from({ length: CLASSES_PER_LAYER }, (_, index) => `c${index}`).sort(),
    );
    expect(first.CID.get("c0")?.size).toBe(LAYERS);
  });

  test("independently built graphs produce identical output", () => {
    const first = compile(buildGraph("same-graph", "s"), true, MEDIA_FEATURES);
    const second = compile(buildGraph("same-graph", "s"), true, MEDIA_FEATURES);

    expect(second.css).toBe(first.css);
    expect(mapEntries(second)).toEqual(mapEntries(first));
  });

  test("separate graphs and compilations stay isolated", () => {
    const alpha = buildGraph("alpha", "a");
    const beta = buildGraph("beta", "b");

    const alphaWithFeature = compile(alpha, true, MEDIA_FEATURES);
    const betaWithoutFeature = compile(beta);
    const alphaWithoutFeature = compile(alpha);

    expect(alphaWithFeature.css).toContain(
      "@media (display-mode: standalone)",
    );
    expect(betaWithoutFeature.css).not.toContain("display-mode");
    // Media features are per compilation, not retained by the instance.
    expect(alphaWithoutFeature.css).not.toContain("display-mode");

    // Separate graphs never contribute each other's prefixed selectors.
    expect(alphaWithFeature.css).not.toContain(".b0_c0");
    expect(betaWithoutFeature.css).not.toContain(".a0_c0");

    // Export-map entries follow each call and are not carried over.
    expect(alphaWithFeature.CID.size).toBe(CLASSES_PER_LAYER);
    expect(alphaWithoutFeature.CID.size).toBe(0);
    expect(betaWithoutFeature.CID.size).toBe(0);
  });

  test("a retained imported class keeps only its referenced keyframes", () => {
    const graph = buildGraph("shake", "s");
    const shaken = new Loader(graph, ["c0"]).load(false);

    expect(shaken.css).toContain(".s0_c0 {");
    expect(shaken.css).toContain(".s3_c0 {");
    expect(shaken.css).toContain("@keyframes s0_slide");
    expect(shaken.css).not.toContain("@keyframes s0_idle");
    // The shaker matches the unprefixed name, so c1 and c10 are both excluded.
    expect(shaken.css).not.toContain(".s0_c1 {");
    expect(shaken.css).not.toContain(".s0_c10 {");
  });

  test("saving the graph writes only into the temporary directory", () => {
    const directory = temporaryDirectory("large-graph");
    const graph = buildGraph("saved-graph", "save");

    graph.save({
      dir: directory,
      mapDir: directory,
      minify: false,
      name: "graph",
    });

    const savedCss = readFileSync(join(directory, "graph.css"), "utf8");
    const savedMap = readFileSync(join(directory, "index.js"), "utf8");
    const expected = compile(graph, true, MEDIA_FEATURES).css;

    expect(savedCss).toBe(expected);
    expect(savedMap).toContain('export const c0="');
    for (let layer = 0; layer < LAYERS; layer++) {
      expect(savedMap).toContain(`save${layer}_c0`);
    }
  });
});
