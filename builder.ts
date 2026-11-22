import { Roll, Oven } from "@ohmyqt/oven";
import { createRequire } from "node:module";

// Resolve the declaration bundler through @ohmyqt/oven, which owns it.
const require = createRequire(import.meta.resolve("@ohmyqt/oven"));
const { dts } = await import(require.resolve("rollup-plugin-dts"));

const Ov = new Oven({
  external: ["bun"],
});

const RP = new Roll({
  input: "./index.d.ts",
}).paths({
  "@": "",
});

// Replace the default dts plugin so @ohmyqt/u declarations are inlined once,
// keeping the published declarations self-contained for consumers.
RP.plugins = [dts({ includeExternal: ["@ohmyqt/u"] })];

await Ov.clear();

Ov.onsuccess = async () => {
  await RP.tsc({
    path: "./tsconfig.build.json",
  });

  await RP.output({ file: "./index.d.ts", format: "esm" });
};

await Ov.build();
// await Ov.watch();
