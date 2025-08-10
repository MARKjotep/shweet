import { Shweet } from "..";
import {
  isArr,
  isDefined,
  log,
  Mapper,
  oAss,
  obj,
  oItems,
  oKeys,
  oVals,
} from "../@";
import { aFrom } from "../@/arr";
import { Property } from "./property";
import { At, Cid, CMapper, FontFace, Keyframes } from "./selectors";
import { media, mtype } from "../media";
import { support } from "../support";

// -------------------------
export type PMtype = keyof mtype;
export type PPRP = { [P in PMtype]?: obj<string[]> };

export class Loader {
  CID: Mapper<string, Set<string>> = new Mapper();
  css: string = "";
  constructor(
    public shweet: Shweet,
    public shaker: string[] = [],
    public include: string[] = [],
  ) {}
  load(exportMap?: boolean) {
    const def = media.default;
    const mprops = media.prop as any;
    oAss(mprops, media.extra);
    const animCLSS: Mapper<string, Set<string>> = new Mapper();
    const props: PPRP = {};
    const supportsProps: obj<PPRP> = {};
    const kprops: obj<PPRP> = {};
    const fin = new Set<string>();
    const cs2: obj<obj<string[]>> = {};
    const suppcs2: obj<obj<obj<Set<string>>>> = {};

    oKeys(mprops).forEach((kh) => {
      cs2[kh as PMtype] = {};
    });

    for (const sw of oVals(this.shweet)) {
      if (sw instanceof Cid) {
        if (!sw.DATA.size) continue;
        //
        this.ClassID(sw, props, supportsProps, exportMap);

        sw.ANIM.forEach((an, ky) => {
          an.forEach((aa) => {
            animCLSS.init(ky, new Set()).add(aa);
          });
        });
      } else if (sw instanceof Keyframes) {
        this.KF(sw, kprops, animCLSS);
      } else if (sw instanceof At) {
        this.AT(sw, fin);
      } else if (sw instanceof FontFace) {
        this.FONT(sw, fin);
      }
    }

    oItems(props).forEach(([mediaSize, css]) => {
      if (!cs2[mediaSize]) cs2[mediaSize] = {};
      oItems(css).forEach(([property, selectors]) => {
        const ct = selectors.join(", ");
        if (!cs2[mediaSize][ct]) cs2[mediaSize][ct] = [];
        cs2[mediaSize][ct].push(property);
      });
    });

    oItems(supportsProps).forEach(([sup, _props]) => {
      oItems(_props).forEach(([mediaSize, css]) => {
        if (!suppcs2[mediaSize]) suppcs2[mediaSize] = {};
        oItems(css).forEach(([property, selectors]) => {
          const ct = `@supports(${sup})`;
          if (!suppcs2[mediaSize][ct]) suppcs2[mediaSize][ct] = {};
          const sels = selectors.join(", ");
          if (!suppcs2[mediaSize][ct][sels])
            suppcs2[mediaSize][ct][sels] = new Set();
          suppcs2[mediaSize][ct][sels].add(property);
        });
      });
    });

    oItems(cs2).forEach(([mediaSize, css]) => {
      const mitm: string[] = [];
      const anims: string[] = [];
      oItems(css).forEach(([selector, properties]) => {
        const isAnimTrans = properties.some((sl) => {
          return sl.startsWith("animation") || sl.startsWith("transition");
        });
        if (isAnimTrans) {
          anims.push(toProperty(selector, properties));
        } else {
          mitm.push(toProperty(selector, properties));
        }
      });

      if (anims.length) {
        mitm.unshift(...anims);
      }

      if (kprops[mediaSize]) {
        oItems(kprops[mediaSize]!).forEach(([atKF, property]) => {
          mitm.push(toProperty(atKF, property as any));
        });
      }

      if (suppcs2[mediaSize]) {
        oItems(suppcs2[mediaSize]!).forEach(([supports, properties]) => {
          const citm = oItems(properties).map(([selector, property]) => {
            return toProperty(selector, [...property]);
          });

          mitm.push(toProperty(supports, citm));
        });
      }

      if (mitm.length) {
        fin.add(
          `/* -------------- ${mediaSize + (mediaSize === def ? " ( default )" : "")} */`,
        );
        if (mediaSize === def) {
          fin.add(mitm.join("\n"));
        } else {
          const fmedia = mediaSize
            .split("-")
            .map((mp) => mprops[mp])
            .join(" and ");

          fin.add(`@media ${fmedia}\t{\n${mitm.join("\n")}\n}`);
        }
      }
    });

    this.css = [...fin].join("\n");
    //
    return this;
  }
  private ClassID(
    sw: Cid,
    props: PPRP,
    supportsProp: obj<obj<PPRP>>,
    exportMap?: boolean,
  ) {
    const KK = (
      property: string,
      med: media,
      pname: string,
      hasClass: boolean,
      props: PPRP,
    ) => {
      oItems(med).forEach(([mediaSize, value]) => {
        this.push(
          props,
          pname,
          mediaSize,
          hasClass,
          Property(property, value, sw.UNIT),
        );
      });
    };

    sw.DATA.forEach((css, selector) => {
      const prefixedName = applyPrefix(selector, sw.PREFIX);
      const hasClass = this.getCID(selector, sw.PREFIX, exportMap);

      css.forEach((med, property) => {
        if (property === "supports") {
          if (isArr(med)) {
            med.forEach((m: support) => {
              m.value.forEach((v, supports) => {
                if (!(supports in supportsProp)) {
                  supportsProp[supports] = {};
                }

                v.forEach((vv) => {
                  oItems(vv).forEach(([_prop, _med]) => {
                    KK(
                      _prop,
                      _med as media,
                      prefixedName,
                      hasClass,
                      supportsProp[supports],
                    );
                  });
                });
              });
            });
          }
        } else {
          KK(property, med, prefixedName, hasClass, props);
        }
      });
    });
    sw.IMPORTED.forEach((sw2) => {
      this.ClassID(sw2, props, supportsProp, sw2.EXPORT);
    });
  }
  private KF(kf: Keyframes, kprops: PPRP, anims: Mapper<string, Set<string>>) {
    const pushKF = (mediaSize: string, prefix: string, val: string) => {
      ensurePropsInitialized(kprops, mediaSize as any, prefix);

      kprops[mediaSize as PMtype]![prefix].push(val);
    };
    kf.DATA.forEach((data, kprefix) => {
      data.forEach((css, kfsel) => {
        const vlc: obj<string[]> = {};
        (css as CMapper).forEach((med, property) => {
          if (property === "supports") {
            log.e = [
              "@supports not supported in @keyframes",
              { error: "support in keyframes" },
            ];
          } else {
            oItems(med).forEach(([mediaSize, value]) => {
              // -------------------------
              if (this.shaker.length) {
                const slc = kprefix.split(" ")[1];
                if (anims.has(slc)) {
                  const anim_g = [...anims.get(slc)!];
                  const hasC = anim_g.some((s) => {
                    return this.getCID(s, "", false, false);
                  });
                  if (hasC) {
                    if (!(mediaSize in vlc)) {
                      vlc[mediaSize] = [];
                    }
                    vlc[mediaSize].push(Property(property, value, kf.UNIT));
                  }
                }
              } else {
                if (!(mediaSize in vlc)) {
                  vlc[mediaSize] = [];
                }
                vlc[mediaSize].push(Property(property, value, kf.UNIT));
              }
              //
            });
          }
        });

        oItems(vlc).forEach(([mediaSize, vlc]) => {
          pushKF(mediaSize, kprefix, toProperty(kfsel, vlc));
        });
      });
    });

    kf.IMPORTED.forEach((kf2) => {
      this.KF(kf2 as any, kprops, anims);
    });
  }
  private AT(at: At, fin: Set<string>) {
    for (const [key, values] of at.ARR) {
      values.forEach((value) => {
        const formattedValue = value.includes("(") ? value : `"${value}"`;
        fin.add(`${key} ${formattedValue.trim()};`);
      });
    }
    at.IMPORTED.forEach((sw2) => {
      this.AT(sw2 as At, fin);
    });
  }
  private FONT(at: FontFace, fin: Set<string>) {
    const FONT_FACE = "@font-face";
    const FC = at.ARR.get(FONT_FACE) ?? new Set();
    FC.forEach((ff) => {
      fin.add(`${FONT_FACE} {\n\t${ff}\n}`);
    });

    at.IMPORTED.forEach((sw2) => {
      this.FONT(sw2, fin);
    });
  }
  private getCID(
    cssStr: string,
    prefix: string,
    exportMap?: boolean,
    exportX: boolean = true,
  ) {
    const classRegex = /\.(?![0-9])([a-zA-Z0-9_-]+)(?![^{]*})/g; // Matches .className
    const idRegex = /#(?![0-9])([a-zA-Z0-9_-]+)(?![^{]*})/g; // Matches #idName
    const tagRegex = /\b([a-zA-Z][a-zA-Z0-9]*)\b(?![^{}]*})/g; // Matches HTML tags like div, span, etc.
    //

    const combined = [
      ...new Set(xmatch(cssStr, classRegex)),
      ...new Set(xmatch(cssStr, idRegex)),
    ];
    if (exportX && isDefined(exportMap) && exportMap) {
      combined.forEach((nn) => {
        this.CID.init(nn.replaceAll("-", "_"), new Set()).add(prefix + nn);
      });
    }
    combined.push(...new Set(xmatch(cssStr, tagRegex)));

    return combined.some(
      (s) => this.shaker.includes(s) || this.include.includes(s),
    );
  }
  private push(
    props: { [P in PMtype]?: obj<string[]> },
    prefixedName: string,
    mediaSize: string,
    hasClass: boolean,
    val: string,
  ) {
    if (
      !(
        (this.shaker.length && prefixedName.startsWith(".")) ||
        (this.shaker.length && prefixedName.startsWith("#"))
      ) ||
      hasClass
    ) {
      ensurePropsInitialized(props, mediaSize as any, val);
      addPropertyValues(props, mediaSize as any, val, prefixedName);
    }
  }
}

export const toProperty = (sel: string, vals: string[]) => {
  return `${sel} {\n  ${vals.join(" \n  ")}\n}`;
};

const xmatch = (cssContent: string, regex: RegExp) => {
  return aFrom(cssContent.matchAll(regex), (match) => match[1]);
};
const ensurePropsInitialized = (
  props: { [P in PMtype]?: obj<string[]> },
  type: PMtype,
  key: string,
) => {
  try {
    if (!props[type]) {
      props[type] = {};
      props[type][key] = [];
    }
    if (!props[type]![key]) props[type]![key] = [];
  } catch (e) {
    log.e = [
      `property "${type}" not found!`,
      { error: "@ensurePropsInitialized" },
    ];
  }
};
const addPropertyValues = (
  props: { [P in PMtype]?: obj<string[]> },
  type: PMtype,
  key: string,
  values: string,
) => {
  if (!props[type]) {
    props[type] = { [key]: values.split(",").map((s) => s.trim()) };
  } else {
    props[type]![key].push(...values.split(",").map((s) => s.trim()));
  }
};
const applyPrefix = (sel: string, prefix?: string) => {
  if (prefix) {
    return sel.replaceAll(/\.|\#/g, (m) => m + prefix);
  }
  return sel;
};
