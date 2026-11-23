import { writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { isArray, isDefined } from "@ohmyqt/u";
import { ensureDirectory, ensureFile } from "../helpers";
import type { exmed, SaveOptions } from "../core/options";
import type { Shweet } from "../core/shweet";
import { Loader } from "../css/compiler";
import { writeExportMap } from "./export-map";
import { minifyCss } from "./minify";

/**
 * Resolves the `dir: "parent"` token against the instance module path. A
 * module at the filesystem root has no parent folder, so writing there would
 * target `/`; callers in that position must pass an explicit directory.
 */
const resolveParentDirectory = (sourcePath: string) => {
  const moduleDirectory = dirname(sourcePath);
  const parentDirectory = dirname(moduleDirectory);

  if (parentDirectory === moduleDirectory) {
    throw new Error(
      `save(): dir: "parent" cannot resolve for "${sourcePath}" because ` +
        `"${moduleDirectory}" is the filesystem root; pass an explicit dir instead.`,
    );
  }

  return { moduleDirectory, parentDirectory };
};

/**
 * Compiles and writes the instance CSS and optional export maps. Filesystem
 * behavior, including the empty-CSS placeholder, matches the previous
 * `save` closure.
 */
export const saveShweet = <T extends exmed>(
  instance: Shweet<T>,
  mediaFeatures: T,
  exportMap: boolean | undefined,
  options: SaveOptions = {},
): Shweet<T> => {
  const {
    dir,
    mapDir = [],
    mapName = "index",
    minify = true,
    shaker = [],
    include = [],
    name: savedName,
    mergeRoot = false,
  } = options;

  // Only the bare string token resolves; arrays and `mapDir` entries are
  // literal folders, so a real folder named `parent` stays addressable.
  const parent =
    dir === "parent" ? resolveParentDirectory(instance.path) : undefined;

  // When the token is used and `mapDir` is omitted entirely (an explicit `[]`
  // still means "no maps"), keep `index.js` beside the source module.
  const resolvedMapDir =
    parent && options.mapDir === undefined
      ? [parent.moduleDirectory]
      : mapDir;

  const exportMapEnabled = isDefined(exportMap) ? exportMap : !!resolvedMapDir;

  const outputName = savedName ?? instance.name;
  const css = new Loader<T>(
    instance,
    shaker,
    include,
    instance.onDiagnostic,
    mergeRoot,
  ).load(exportMapEnabled, mediaFeatures);

  const outputDirectories = isArray<string>(dir)
    ? dir
    : [parent ? parent.parentDirectory : dir];

  const cssContent = minify ? minifyCss(css.css) : css.css;

  outputDirectories.forEach((outputDirectory) => {
    if (!outputDirectory) return;
    const pathEnd = outputDirectory.endsWith("/") ? "" : "/";
    const cssFilePath = `${outputDirectory}${pathEnd}${outputName}.css`;

    ensureDirectory(outputDirectory + pathEnd);
    ensureFile(cssFilePath);
    writeFileSync(cssFilePath, cssContent || "/* --------------*/");
  });

  const mapDirectories = isArray<string>(resolvedMapDir)
    ? resolvedMapDir
    : [resolvedMapDir];

  for (const mapDirectory of mapDirectories) {
    // Mirror the CSS directory handling: an omitted/empty entry (including a
    // stray empty array element) must not resolve to the filesystem root.
    if (!mapDirectory) continue;

    const mapEnd = mapDirectory.endsWith("/") ? "" : "/";
    const mapFilePath = `${mapDirectory}${mapEnd}${mapName}.js`;

    ensureDirectory(mapDirectory + mapEnd);
    ensureFile(mapFilePath);

    writeExportMap(mapFilePath, css.CID);
  }

  return instance;
};
