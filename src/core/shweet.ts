import { isArray } from "@ohmyqt/u";
import { bind } from "../helpers";
import type { FontFace } from "../css/selectors";
import type { atCSS, CSSValue, KFCSS } from "../type";
import { med, media, type mtype } from "../media";
import { Var, type _Var } from "../var";
import {
  createSelectorHandlers,
  loadSelectorHandlers,
  toProxyHandlers,
} from "./registry";
import type {
  DiagnosticHandler,
  OverrideMap,
  OverrideModePair,
  OverrideValue,
  SaveOptions,
  ShweetOptions,
  __CSS,
  exmed,
} from "./options";
import { saveShweet } from "../output/save";

const isModePair = (value: OverrideValue): value is OverrideModePair =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  ("light" in value || "dark" in value);

export class Shweet<T extends exmed = exmed> {
  [k: string]: any;
  path: string;
  name: string | undefined;
  prefix: string;
  exportMap?: boolean | undefined;
  onDiagnostic: DiagnosticHandler | undefined;
  private mediaFeatures: T;
  /** Original options, kept so {@link override} can rebuild a faithful clone. */
  private options: ShweetOptions<T>;
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
  constructor(options: ShweetOptions<T>) {
    this.options = options;
    const {
      __filename,
      name,
      prefix,
      shweets = [],
      exportMap,
      webkitKeyframes,
      mediaFeature = {} as T,
      unit = "rem",
      onDiagnostic,
    } = options;
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

  /**
   * Return a clone of this instance with the given custom-property (var) values
   * overridden. Custom-property names stay stable; only values change. A flat
   * value applies to both light and dark modes, while `{ light, dark }` sets the
   * explicit pair.
   */
  override(overrides: OverrideMap = {}): this {
    const tokens: _Var[] = [];

    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) continue;

      let variables: media;
      if (isModePair(value)) {
        if (value.light !== undefined && value.dark !== undefined) {
          variables = med({ light: value.light, dark: value.dark });
        } else if (value.light !== undefined) {
          variables = med({ light: value.light });
        } else if (value.dark !== undefined) {
          variables = med({ dark: value.dark });
        } else {
          continue;
        }
      } else {
        variables = med(value, { light: value, dark: value });
      }

      tokens.push(Var({ [key]: variables }));
    }

    // Own handler data is collected before imports, so the overrides must live
    // in a trailing chain link to outrank the original `:root` values.
    const overridesLayer = new Shweet<T>({
      __filename: this.path,
      prefix: this.prefix,
    });
    if (tokens.length) overridesLayer.d[":root"] = tokens;

    return new Shweet<T>({
      ...this.options,
      shweets: [this, overridesLayer],
    }) as this;
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
