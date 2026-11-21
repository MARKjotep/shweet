import { isArray } from "@ohmyqt/u";
import { bind } from "../helpers";
import type { FontFace } from "../css/selectors";
import type { atCSS, CSSValue, KFCSS } from "../type";
import { media, type mtype } from "../media";
import {
  createSelectorHandlers,
  loadSelectorHandlers,
  toProxyHandlers,
} from "./registry";
import type {
  DiagnosticHandler,
  SaveOptions,
  ShweetOptions,
  __CSS,
  exmed,
} from "./options";
import { saveShweet } from "../output/save";

export class Shweet<T extends exmed = exmed> {
  [k: string]: any;
  path: string;
  name: string | undefined;
  prefix: string;
  exportMap?: boolean | undefined;
  onDiagnostic: DiagnosticHandler | undefined;
  private mediaFeatures: T;
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
  save: (x?: SaveOptions) => this;
  constructor({
    __filename,
    name,
    prefix,
    shweets = [],
    exportMap,
    webkitKeyframes,
    mediaFeature = {} as T,
    unit = "rem",
    onDiagnostic,
  }: ShweetOptions<T>) {
    this.path = __filename;
    this.name = name || fileName(__filename);
    this.prefix = prefix ?? "";
    this.exportMap = exportMap;
    this.onDiagnostic = onDiagnostic;
    const imported: Shweet[] = isArray<Shweet>(shweets) ? shweets : [shweets];

    this.mediaFeatures = mediaFeature;

    const handlers = createSelectorHandlers(
      this.prefix,
      webkitKeyframes,
      exportMap,
      unit,
      this.path,
    );
    loadSelectorHandlers(handlers, imported, this._imported);
    Object.assign(this, toProxyHandlers(handlers));

    const instance = this;
    Object.assign(this, {
      get shweet() {
        return instance;
      },
    });

    this.save = (options: SaveOptions = {}) => {
      saveShweet(this, this.mediaFeatures, exportMap, options);
      return this;
    };
  }
  get imported() {
    return [...this._imported];
  }

  med(g: mtype & T): media;
  med(defValue: CSSValue): media;
  med(defValue: CSSValue, g: mtype & T): media;
  @bind med(defValueOrG: CSSValue | mtype, g?: mtype & T) {
    if (g) {
      return new media(defValueOrG as CSSValue, g);
    }
    if (typeof defValueOrG === "object") {
      return new media(undefined, defValueOrG);
    }
    return new media(defValueOrG as CSSValue, {});
  }
}

export function fileName(path: string) {
  return path.split("/").slice(-1)[0]!.split(".")[0];
}
