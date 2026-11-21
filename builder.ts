import { createRequire } from "node:module";
import { Oven, Roll } from "@ohmyqt/oven";

/**
 * `rollup` and `rollup-plugin-dts` are provided by the existing Oven toolchain.
 * Resolve them through Oven so the builder works from the isolated temporary
 * copy used by the package smoke test, where only the project's development
 * dependencies are linked.
 */
const requireFromOven = createRequire(
  createRequire(import.meta.url).resolve("@ohmyqt/oven"),
);

type RollupRuntime = {
  rollup: (options: {
    input: string;
    plugins: unknown[];
  }) => Promise<{
    write: (options: { file: string; format: "es" }) => Promise<unknown>;
    close: () => Promise<void>;
  }>;
};

type DtsPlugin = {
  dts: (options?: { includeExternal?: string[] }) => unknown;
};

const { rollup } = (await import(
  requireFromOven.resolve("rollup")
)) as unknown as RollupRuntime;
const { dts } = (await import(
  requireFromOven.resolve("rollup-plugin-dts")
)) as unknown as DtsPlugin;

const RP = new Roll({
  input: "./index.d.ts",
}).paths({
  "@@": "",
});

const OV = new Oven({
  files: ["."],
  target: "bun",
});
// ---  ---------------------------------------------------------------

/**
 * Bundles the emitted declarations into a single self-contained file.
 *
 * `@ohmyqt/u` is a build-time helper, not a published dependency. Inlining its
 * types is what lets a fresh consumer typecheck the packed package with
 * `skipLibCheck: false` without installing the helper package.
 */
const bundleDeclarations = async () => {
  const bundle = await rollup({
    input: "./types/index.d.ts",
    plugins: [
      dts({
        includeExternal: ["@ohmyqt/u"],
      }),
    ],
  });

  try {
    await bundle.write({
      file: "./dist/index.d.ts",
      format: "es",
    });
  } finally {
    await bundle.close();
  }
};

OV.onsuccess = async () => {
  await RP.tsc({
    path: "tsconfig.build.json",
    clear: true,
  });

  await bundleDeclarations();
};

await OV.clear();
await OV.build();
// await OV.watch();
