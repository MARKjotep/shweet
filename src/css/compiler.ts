import { Mapped } from "@ohmyqt/u";
import { media } from "../media";
import type { DiagnosticHandler, exmed } from "../core/options";
import type { Shweet } from "../core/shweet";
import { collectCss } from "./collect";
import { groupDeclarations, groupSupports } from "./group";
import { serializeCss } from "./serialize";

/**
 * Compatibility entry point for compiling a Shweet instance. It keeps the
 * public `CID`/`css`/`load` surface used by the root `save` method and deep
 * imports.
 */
export class Loader<T extends exmed = exmed> {
  CID: Mapped<string, Set<string>> = new Mapped();
  css: string = "";
  /** Structured diagnostic sink for this compilation. */
  onDiagnostic: DiagnosticHandler | undefined;
  constructor(
    public shweet: Shweet<T>,
    public shaker: string[] = [],
    public include: string[] = [],
    /**
     * Optional per-compilation override. When omitted, the root instance's
     * `onDiagnostic` option is used.
     */
    onDiagnostic?: DiagnosticHandler,
    /** Fold same-selector `:root` groups per media bucket. */
    public mergeRoot: boolean = false,
  ) {
    this.onDiagnostic = onDiagnostic ?? shweet.onDiagnostic;
  }
  load(exportMap?: boolean, mediaFeatures: Record<string, unknown> = {}) {
    const defaultMedia = media.default;

    // Each `load` is a fresh compilation. Clearing keeps a reused loader from
    // mixing export-map entries collected by an earlier call.
    this.CID.clear();

    // Resolve media values for this compilation only. The previous loader
    // wrote `extra` and per-instance features into the shared static defaults,
    // which leaked custom media features into later compilations.
    const mediaProperties: Record<string, unknown> = {
      ...media.prop,
      ...media.extra,
      ...mediaFeatures,
    };

    const collected = collectCss(this.shweet, {
      shaker: this.shaker,
      include: this.include,
      exportMap,
      cid: this.CID,
      sourcePath: this.shweet.path,
      onDiagnostic: this.onDiagnostic,
    });

    const groupedRulesByMedia = groupDeclarations(
      collected.styleRulesByMedia,
      Object.keys(mediaProperties),
    );
    const groupedSupportsByMedia = groupSupports(
      collected.supportsRulesByCondition,
    );

    this.css = serializeCss(
      {
        groupedRulesByMedia,
        groupedSupportsByMedia,
        keyframeBlocksByMedia: collected.keyframeBlocksByMedia,
        atRules: collected.atRules,
      },
      mediaProperties,
      defaultMedia,
      this.mergeRoot,
    );

    return this;
  }
}
