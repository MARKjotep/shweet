import { writeFileSync } from "node:fs";
import { ensureDirectory, ensureFile, isArray, isDefined } from "../helpers";
import type { exmed, SaveOptions } from "../core/options";
import type { Shweet } from "../core/shweet";
import { Loader } from "../css/compiler";
import { writeExportMap } from "./export-map";
import { minifyCss } from "./minify";

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
  } = options;

  const exportMapEnabled = isDefined(exportMap) ? exportMap : !!mapDir;

  const outputName = savedName ?? instance.name;
  const css = new Loader<T>(
    instance,
    shaker,
    include,
    instance.onDiagnostic,
  ).load(exportMapEnabled, mediaFeatures);

  const outputDirectories = isArray<string>(dir) ? dir : [dir];

  const cssContent = minify ? minifyCss(css.css) : css.css;

  outputDirectories.forEach((outputDirectory) => {
    if (!outputDirectory) return;
    const pathEnd = outputDirectory.endsWith("/") ? "" : "/";
    const cssFilePath = `${outputDirectory}${pathEnd}${outputName}.css`;

    ensureDirectory(outputDirectory + pathEnd);
    ensureFile(cssFilePath);
    writeFileSync(cssFilePath, cssContent || "/* --------------*/");
  });

  const mapDirectories = isArray<string>(mapDir) ? mapDir : [mapDir];

  for (const mapDirectory of mapDirectories) {
    const mapEnd = mapDirectory.endsWith("/") ? "" : "/";
    const mapFilePath = `${mapDirectory}${mapEnd}${mapName}.js`;

    ensureDirectory(mapDirectory + mapEnd);
    ensureFile(mapFilePath);

    writeExportMap(mapFilePath, css.CID);
  }

  return instance;
};
