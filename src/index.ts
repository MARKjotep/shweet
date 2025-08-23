import { isArr, obj, oItems, oKeys, oAss, Mapper, isDefined } from "./@";
import { At, FontFace, Cid, Keyframes } from "./css/selectors";
import { atCSS, CSS, KFCSS } from "./type";
import { Loader } from "./css";
import { isDir, isFile } from "./@/bun";
import { writeFileSync } from "node:fs";

/*
-------------------------
Exports
-------------------------
*/
export { log, __ } from "./@";
export { ps } from "./@misc/ps";
export { f } from "./@misc/f";
export { v } from "./@misc/v";
export { supports } from "./support";
export { med, media, Medyas } from "./media";
export { Var, Vars } from "./var";
export { Value } from "./css/value";

export type * from "./type";

// -------------------------
interface saveCSS {
  dir?: string | string[];
  mapDir?: string;
  mapName?: string;
  minify?: boolean;
  shaker?: string[];
  include?: string[];
  includeAnimation?: string[];
}
interface shweetCFG {
  __filename: string;
  name?: string;
  prefix?: string;
  shweets?: Shweet | Shweet[];
  exportMap?: boolean;
  webkitKeyframes?: boolean;
  unit?: "rem" | "em" | "px" | "pt" | "pc";
}

type __CSS = CSS & { __: (a: CSS) => void };

export class Shweet {
  [k: string]: any;
  path: string;
  name: string;
  prefix: string;
  exportMap?: boolean;
  protected _imported = new Set<string>();
  declare d: __CSS;
  declare i: __CSS;
  declare c: __CSS;
  declare kf: KFCSS & { __: (a: KFCSS) => void };
  declare at: {
    import: atCSS;
    charset: atCSS;
  };
  declare font: FontFace["css"];
  declare shweet: this;
  save: ({}: saveCSS) => this;
  constructor({
    __filename,
    name,
    prefix,
    shweets = [],
    exportMap,
    webkitKeyframes,
    unit = "rem",
  }: shweetCFG) {
    this.path = __filename;
    this.name = name || fileName(__filename);
    this.prefix = prefix ?? "";
    this.exportMap = exportMap;
    const imported = isArr(shweets) ? shweets : [shweets];

    loader.call(this, this.prefix, imported, webkitKeyframes, exportMap, unit);
    const TH = this;
    Object.assign(this, {
      get shweet() {
        return TH;
      },
    });

    this.save = ({
      dir,
      mapDir,
      mapName = "index",
      minify = true,
      shaker = [],
      include = [],
    }: saveCSS) => {
      const fXP = isDefined(exportMap) ? exportMap : !!mapDir;

      //
      const css = new Loader(this, shaker, include).load(fXP);

      const _DIR = isArr(dir) ? dir : [dir];

      const cssContent = minify ? parseCSS(css.css) : css.css;
      // -------------------------

      _DIR.forEach((dd) => {
        if (!dd) return;
        const pathEnd = dd.endsWith("/") ? "" : "/";
        const cssFilePath = dd + pathEnd + this.name + ".css";

        isDir(dd + pathEnd);
        isFile(cssFilePath);
        writeFileSync(cssFilePath, cssContent || "/* --------------*/");
      });

      if (mapDir) {
        const mapEnd = mapDir.endsWith("/") ? "" : "/";

        const mapFilePath = mapDir + mapEnd + mapName + ".js";

        isDir(mapDir + mapEnd);
        isFile(mapFilePath);

        mapWriter(mapFilePath, css.CID);
      }

      return this;
    };
  }
  get imported() {
    return [...this._imported];
  }
}

const parseCSS = (css: string): string => {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s*([{}:;,])\s*/g, "$1")
    .replace(/\s*([>~+])\s*/g, "$1")
    .trim();
};

const mapWriter = (filePath: string, cids: Mapper<string, Set<string>>) => {
  //
  const consol: obj<string[]> = {};

  cids.forEach((v) => {
    oItems(v).forEach(([x, y]) => {
      if (!consol[x]) {
        consol[x] = [y];
      } else {
        consol[x].push(y);
      }
    });
  });

  const NITEM = [...cids.entries()]
    .map(([k, v]) => {
      return `${k}="${[...v].join(" ")}"`;
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  writeFileSync(
    filePath,
    NITEM.length ? `export const ${NITEM.join()};` : "export {}",
  );

  return;
};

function loader(
  this: Shweet,
  pref: string,
  loads: Shweet[],
  webkf: boolean = false,
  exMap?: boolean,
  unit?: string,
) {
  const props: Record<string, Cid | At | FontFace> = {
    d: new Cid("", pref, exMap, unit),
    i: new Cid("#", pref, exMap, unit),
    c: new Cid(".", pref, exMap, unit),
    kf: new Keyframes(pref, webkf, unit),
    at: new At(),
    font: new FontFace(),
  };

  loads.forEach((l) => {
    this._imported.add(l.path);
    l._imported.forEach((fr) => {
      this._imported.add(fr);
    });

    oKeys(props).forEach((pr) => {
      props[pr].load(l[pr]);
    });
  });

  oKeys(props).forEach((pr) => {
    props[pr] = props[pr].css as any;
  });

  oAss(this, props);
}

export function fileName(path: string) {
  return path.split("/").slice(-1)[0].split(".")[0];
}
