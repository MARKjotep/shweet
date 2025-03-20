import { log, reCamel } from "../../@";
import { CSSValue } from "../../types";
import { _Var } from "../../var";
import { Value } from "../value";

const secs = new Set([
  "transitionDuration",
  "transitionDelay",
  "animationDelay",
  "animationDuration",
]);

const norems = new Set([
  ...secs,
  "zIndex",
  "opacity",
  "aspectRatio",
  "order",
  "flexShrink",
  "flexGrow",
  "flex",
  "fillOpacity",
  "lineClamp",
  "order",
  "scale",
  "webkitLineClamp",
  //
  "animationIterationCount",
  "animationTimingFunction",
  "transitionTimingFunction",
  //
  "columnCount",

  // grid
  "gridColumn",
  "gridRow",
  "gridColumnStart",
  "gridColumnEnd",
  "gridRowStart",
  "gridRowEnd",
]);

const toQuote = new Set(["content"]);

const ARRcomma = new Set(["transitionProperty"]);

export const Property = (key: string, val: CSSValue, unit: string = "rem") => {
  const RV = Value(val, {
    rem: !norems.has(key),
    second: secs.has(key),
    quote: toQuote.has(key),
    delimeter: ARRcomma.has(key) ? ", " : " ",
    unit,
  });

  return `${reCamel(key)}: ${RV};`;
};
