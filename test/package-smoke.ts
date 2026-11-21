/**
 * Manual package smoke test.
 *
 * Builds the current source with the documented builder workflow in an
 * isolated temporary copy, packs the result with `npm pack`, installs the
 * archive into a fresh consumer, and verifies:
 *
 * - the packed root and a deep ESM import load under Node;
 * - the installed package really comes from the archive, not this project's
 *   `node_modules`;
 * - a small TypeScript consumer typechecks against the packed declarations
 *   with `skipLibCheck: false` and no helper packages installed.
 *
 * It is intentionally not named `*.test.ts`: `bun test` must not run it.
 * Invoke it directly with `bun test/package-smoke.ts`.
 *
 * CI can point the consumer typecheck at a separately installed compiler
 * without touching this project's `node_modules`:
 *
 *   bun test/package-smoke.ts \
 *     --tsc /path/to/typescript/lib/tsc.js \
 *     --typescript-version 5.9.3
 *
 * The reported `tsc --version` must match `--typescript-version`. Without the
 * flags the script keeps using the project's own TypeScript when it satisfies
 * the `^5.8.2` peer range.
 *
 * Only built-in APIs and the already-installed bun/npm/node/TypeScript tools
 * are used. Every artifact lives under the system temporary directory and is
 * removed on exit.
 */
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PREFIX = "[package-smoke]";
const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Relative project files that must be identical before and after the run. */
const PRESERVED_FILES = [
  "builder.ts",
  "package.json",
  "tsconfig.json",
  "tsconfig.build.json",
];

/** Project directories whose contents must be identical before and after. */
const PRESERVED_DIRS = ["dist", "types"];

const USAGE =
  "usage: bun test/package-smoke.ts [--tsc <path> --typescript-version <x.y.z>]";

type RunOptions = { cwd: string; env: NodeJS.ProcessEnv };

type TypeScriptOverride = { binary: string; expectedVersion: string };

type TypeScriptCompiler = { binary: string; version: string; source: string };

const log = (message: string) => console.log(`${PREFIX} ${message}`);

const run = (
  command: string,
  args: string[],
  options: RunOptions,
): SpawnSyncReturns<string> =>
  spawnSync(command, args, { ...options, encoding: "utf8" });

const mustRun = (
  command: string,
  args: string[],
  options: RunOptions,
): SpawnSyncReturns<string> => {
  const result = run(command, args, options);

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      [
        `command failed with exit code ${String(result.status)}:`,
        `${command} ${args.join(" ")}`,
        result.stdout.trim(),
        result.stderr.trim(),
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return result;
};

const hashFile = (path: string): string =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

/** Lists files recursively using only synchronous `node:fs` calls. */
const listFiles = (root: string, prefix = ""): string[] => {
  const result: string[] = [];

  for (const entry of readdirSync(join(root, prefix), { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      result.push(...listFiles(root, relative));
    } else if (entry.isFile()) {
      result.push(relative);
    }
  }

  return result.sort();
};

const snapshotProject = (): Record<string, string> => {
  const snapshot: Record<string, string> = {};

  for (const file of PRESERVED_FILES) {
    const absolute = join(PROJECT_ROOT, file);
    if (existsSync(absolute)) snapshot[file] = hashFile(absolute);
  }

  for (const directory of PRESERVED_DIRS) {
    const absolute = join(PROJECT_ROOT, directory);
    if (!existsSync(absolute)) continue;

    for (const file of listFiles(absolute)) {
      snapshot[`${directory}/${file}`] = hashFile(join(absolute, file));
    }
  }

  return snapshot;
};

const assertWithin = (path: string, root: string) => {
  const realPath = realpathSync(path);
  const realRoot = realpathSync(root);

  if (realPath !== realRoot && !realPath.startsWith(`${realRoot}/`)) {
    throw new Error(`expected ${realPath} to live under ${realRoot}`);
  }
};

/**
 * Parses the optional CI override. Both flags are required together so a
 * mistyped path cannot silently fall back to the project compiler.
 */
const parseTypeScriptOverride = (
  argv: readonly string[],
): TypeScriptOverride | undefined => {
  let binary: string | undefined;
  let expectedVersion: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index] ?? "";

    if (!argument.startsWith("--")) {
      throw new Error(`unexpected argument ${argument}\n${USAGE}`);
    }

    const separator = argument.indexOf("=");
    const flag = separator === -1 ? argument : argument.slice(0, separator);
    const inline =
      separator === -1 ? undefined : argument.slice(separator + 1);

    if (flag !== "--tsc" && flag !== "--typescript-version") {
      throw new Error(`unknown argument ${flag}\n${USAGE}`);
    }

    const value = inline ?? argv[index + 1];

    if (
      value === undefined ||
      value.length === 0 ||
      (inline === undefined && value.startsWith("--"))
    ) {
      throw new Error(`${flag} requires a value\n${USAGE}`);
    }

    if (inline === undefined) index += 1;
    if (flag === "--tsc") {
      binary = value;
    } else {
      expectedVersion = value;
    }
  }

  if (binary === undefined && expectedVersion === undefined) return undefined;

  if (binary === undefined || expectedVersion === undefined) {
    throw new Error(
      `--tsc and --typescript-version must be provided together\n${USAGE}`,
    );
  }

  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(expectedVersion)) {
    throw new Error(
      `invalid --typescript-version ${expectedVersion}\n${USAGE}`,
    );
  }

  return { binary: resolve(binary), expectedVersion };
};

/** Runs the compiler's own version command so CI checks what it really uses. */
const reportedTypeScriptVersion = (binary: string): string => {
  const result = mustRun("node", [binary, "--version"], {
    cwd: PROJECT_ROOT,
    env: process.env,
  });
  const version = /(?:^|\s)Version\s+(\S+)/m.exec(
    `${result.stdout}\n${result.stderr}`,
  )?.[1];

  if (!version) {
    throw new Error(`could not read a TypeScript version from ${binary}`);
  }

  return version;
};

const overrideTypeScript = (
  override: TypeScriptOverride,
): TypeScriptCompiler => {
  if (!existsSync(override.binary) || !statSync(override.binary).isFile()) {
    throw new Error(`--tsc is not a file: ${override.binary}`);
  }

  const reported = reportedTypeScriptVersion(override.binary);

  if (reported !== override.expectedVersion) {
    throw new Error(
      `TypeScript override reported ${reported}, expected ${override.expectedVersion}`,
    );
  }

  return { binary: override.binary, version: reported, source: "override" };
};

/** Uses the installed TypeScript only when it satisfies `^5.8.2`. */
const supportedTypeScript = (): string | undefined => {
  const packagePath = join(
    PROJECT_ROOT,
    "node_modules",
    "typescript",
    "package.json",
  );

  if (!existsSync(packagePath)) return undefined;

  const { version } = JSON.parse(readFileSync(packagePath, "utf8")) as {
    version?: unknown;
  };
  if (typeof version !== "string") return undefined;

  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) return undefined;

  const major = Number(match[1] ?? "0");
  const minor = Number(match[2] ?? "0");
  const patch = Number(match[3] ?? "0");
  const supported =
    major === 5 && (minor > 8 || (minor === 8 && patch >= 2));

  return supported ? version : undefined;
};

const projectTypeScript = (): TypeScriptCompiler | undefined => {
  const version = supportedTypeScript();
  if (!version) return undefined;

  const binary = join(
    PROJECT_ROOT,
    "node_modules",
    "typescript",
    "lib",
    "tsc.js",
  );
  if (!existsSync(binary)) return undefined;

  return { binary, version, source: "project" };
};

const consumerSource = `import { Shweet, Medyas, f, med } from "shweet";
import type {
  CSS,
  CSSF,
  CSSValue,
  CSSinR,
  KFCSS,
  MedyasOptions,
  VarType,
  atCSS,
  fontFace,
} from "shweet";
import { Shweet as DeepShweet } from "shweet/dist/index.js";

const options: MedyasOptions = { prefix: "typecheck" };
const medyas = new Medyas(options);

const base = new Shweet({ __filename: "consumer.ts", prefix: "typecheck" });
base.c.card = { color: "red", padding: 1, width: med(2) };
base.c.min = { width: f.min("100%", "60rem") };

const deep = new DeepShweet({ __filename: "consumer.ts", prefix: "deep" });
deep.c.card = { color: "blue" };

type PublicTypes = [
  CSS,
  CSSF,
  CSSValue,
  CSSinR,
  KFCSS,
  VarType,
  atCSS,
  fontFace,
];

void [base, deep, medyas];
export type { PublicTypes };
`;

const consumerTsconfig = `${JSON.stringify(
  {
    compilerOptions: {
      target: "ESNext",
      module: "ESNext",
      moduleResolution: "bundler",
      lib: ["ESNext", "DOM"],
      strict: true,
      skipLibCheck: false,
      noEmit: true,
    },
    include: ["consumer.ts"],
  },
  null,
  2,
)}\n`;

const runtimeSource = `import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Medyas, Shweet, med } from "shweet";
import * as deep from "shweet/dist/index.js";

const expectedExports = [
  "Medyas",
  "Shweet",
  "Value",
  "Var",
  "Vars",
  "X",
  "XX",
  "XY",
  "Z",
  "__",
  "f",
  "fileName",
  "log",
  "med",
  "media",
  "ps",
  "supports",
  "v",
];

assert.deepEqual(Object.keys(deep).sort(), expectedExports);
assert.equal(deep.Shweet, Shweet);
assert.equal(deep.Medyas, Medyas);

const base = new Shweet({ __filename: "runtime.mjs", prefix: "smoke" });
base.c.card = { color: "red", padding: 1 };
assert.deepEqual(base.imported, []);
assert.equal(med("red", { md: "blue" }).md, "blue");
new Medyas({ prefix: "smoke" });

const outputDirectory = process.env.SMOKE_OUT;
assert.ok(outputDirectory, "SMOKE_OUT must be set");
mkdirSync(outputDirectory, { recursive: true });
base.save({ dir: outputDirectory, minify: false });

const css = readFileSync(join(outputDirectory, "runtime.css"), "utf8");
assert.match(css, /\\.smoke_card\\s*\\{/);
assert.match(css, /color: red/);
assert.match(css, /padding: 1rem/);

console.log("runtime-ok");
`;

const childEnvironment = (
  buildDirectory: string,
  cacheDirectory: string,
): NodeJS.ProcessEnv => {
  const pathEntries = [
    join(buildDirectory, "node_modules", ".bin"),
    join(PROJECT_ROOT, "node_modules", ".bin"),
    process.env.PATH,
  ].filter((entry): entry is string => Boolean(entry));

  return {
    ...process.env,
    PATH: pathEntries.join(":"),
    // Keep `npm pack` and the consumer install fully inside the temporary
    // workspace; never read from or write to the user's global npm cache.
    npm_config_cache: cacheDirectory,
  };
};

const main = () => {
  const typeScriptOverride = parseTypeScriptOverride(process.argv.slice(2));
  const overrideCompiler = typeScriptOverride
    ? overrideTypeScript(typeScriptOverride)
    : undefined;
  const tempRoot = mkdtempSync(join(tmpdir(), "shweet-package-smoke-"));
  const buildDirectory = join(tempRoot, "build");
  const packDirectory = join(tempRoot, "pack");
  const consumerDirectory = join(tempRoot, "consumer");
  const consumerOutput = join(consumerDirectory, "out");
  const notes: string[] = [];

  try {
    const before = snapshotProject();
    log(`temporary workspace: ${tempRoot}`);

    const projectModules = join(PROJECT_ROOT, "node_modules");
    const buildDependencies = ["@ohmyqt/oven", "@ohmyqt/u"];
    // An explicit override means the project compiler is not needed at all.
    if (!overrideCompiler) buildDependencies.push("typescript");

    for (const dependency of buildDependencies) {
      if (!existsSync(join(projectModules, dependency))) {
        throw new Error(
          `build dependency ${dependency} is missing from the project; refusing to run the builder`,
        );
      }
    }

    // --- Isolated build copy -------------------------------------------
    mkdirSync(buildDirectory, { recursive: true });
    cpSync(join(PROJECT_ROOT, "src"), join(buildDirectory, "src"), {
      recursive: true,
    });

    for (const file of PRESERVED_FILES) {
      copyFileSync(join(PROJECT_ROOT, file), join(buildDirectory, file));
    }

    symlinkSync(projectModules, join(buildDirectory, "node_modules"), "dir");

    const environment = childEnvironment(
      buildDirectory,
      join(tempRoot, "npm-cache"),
    );
    const buildOptions: RunOptions = {
      cwd: buildDirectory,
      env: environment,
    };

    log("running the documented builder workflow in the temporary copy");
    mustRun("bun", ["builder.ts"], buildOptions);

    for (const artifact of ["dist/index.js", "dist/index.d.ts"]) {
      const absolute = join(buildDirectory, artifact);

      if (!existsSync(absolute) || statSync(absolute).size === 0) {
        throw new Error(`builder did not produce ${artifact}`);
      }
    }

    const declarations = readFileSync(
      join(buildDirectory, "dist/index.d.ts"),
      "utf8",
    );

    for (const exported of ["Shweet", "Medyas", "MedyasOptions"]) {
      if (!declarations.includes(exported)) {
        throw new Error(`packed declarations are missing ${exported}`);
      }
    }

    if (/from\s+["']\.\.?\//.test(declarations)) {
      throw new Error("packed declarations still contain relative imports");
    }

    if (/from\s+["']@ohmyqt\/u["']/.test(declarations)) {
      throw new Error(
        "packed declarations still import @ohmyqt/u instead of inlining its types",
      );
    }

    // --- Pack ----------------------------------------------------------
    mkdirSync(packDirectory, { recursive: true });
    mustRun(
      "npm",
      ["pack", "--pack-destination", packDirectory],
      buildOptions,
    );

    const archives = readdirSync(packDirectory).filter((file) =>
      file.endsWith(".tgz"),
    );

    if (archives.length !== 1) {
      throw new Error(
        `expected exactly one packed archive, found ${archives.length}`,
      );
    }

    const archive = join(packDirectory, archives[0]!);
    const archiveEntries = mustRun("tar", ["-tzf", archive], buildOptions)
      .stdout.trim()
      .split("\n");

    for (const expected of [
      "package/package.json",
      "package/dist/index.js",
      "package/dist/index.d.ts",
    ]) {
      if (!archiveEntries.includes(expected)) {
        throw new Error(`packed archive is missing ${expected}`);
      }
    }

    log(`packed ${archives[0]}`);

    // --- Fresh consumer -------------------------------------------------
    mkdirSync(consumerDirectory, { recursive: true });
    writeFileSync(
      join(consumerDirectory, "package.json"),
      `${JSON.stringify(
        {
          name: "shweet-package-smoke-consumer",
          private: true,
          type: "module",
        },
        null,
        2,
      )}\n`,
    );

    const consumerOptions: RunOptions = {
      cwd: consumerDirectory,
      env: environment,
    };

    // `--legacy-peer-deps` and `--offline` keep npm from resolving the
    // TypeScript peer dependency through the network.
    mustRun(
      "npm",
      [
        "install",
        "--no-audit",
        "--no-fund",
        "--offline",
        "--legacy-peer-deps",
        "--ignore-scripts",
        archive,
      ],
      consumerOptions,
    );

    const installedPackage = join(
      consumerDirectory,
      "node_modules",
      "shweet",
    );
    assertWithin(installedPackage, tempRoot);

    if (existsSync(join(consumerDirectory, "node_modules", "@ohmyqt", "u"))) {
      throw new Error(
        "consumer unexpectedly installed @ohmyqt/u from the project toolchain",
      );
    }

    // --- Node ESM runtime ----------------------------------------------
    writeFileSync(join(consumerDirectory, "runtime.mjs"), runtimeSource);
    mustRun("node", ["runtime.mjs"], {
      ...consumerOptions,
      env: { ...consumerOptions.env, SMOKE_OUT: consumerOutput },
    });
    notes.push("Node ESM root and deep import: passed");

    // --- TypeScript consumer -------------------------------------------
    const compiler = overrideCompiler ?? projectTypeScript();

    if (!compiler) {
      notes.push(
        "TypeScript consumer: skipped (no installed TypeScript ^5.8.2)",
      );
    } else {
      writeFileSync(
        join(consumerDirectory, "consumer.ts"),
        consumerSource,
      );
      writeFileSync(
        join(consumerDirectory, "tsconfig.json"),
        consumerTsconfig,
      );

      mustRun("node", [compiler.binary, "-p", "tsconfig.json"], consumerOptions);

      notes.push(
        `TypeScript ${compiler.version} consumer (${compiler.source} compiler, skipLibCheck false): passed`,
      );
    }

    // --- Project isolation ---------------------------------------------
    const after = snapshotProject();
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      throw new Error(
        "the smoke run changed project artifacts (dist, types, or configuration)",
      );
    }
    notes.push("project artifacts unchanged");

    for (const note of notes) log(note);
    log("PASS");
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
    log(`cleaned ${tempRoot}`);
  }
};

try {
  main();
} catch (error) {
  process.exitCode = 1;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`${PREFIX} FAIL: ${message}`);
}
