import { camel, reCamel } from "@ohmyqt/u";
import type { CSSValue } from "../../type";
import { Value } from "../value";

const timeProperties = new Set([
  "transitionDuration",
  "transitionDelay",
  "animationDelay",
  "animationDuration",
]);

const unitlessProperties = new Set([
  ...timeProperties,
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
  "lineHeight",
  "fontWeight",
  "orphans",
  "widows",
  "tabSize",
  "zoom",
  "borderImageOutset",
  "borderImageSlice",
  "borderImageWidth",
  //
  "animationIterationCount",
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

const commaSeparatedProperties = new Set([
  "transitionProperty",
  // CSS animation lists are comma-separated; an array value would otherwise
  // serialize as one invalid shorthand.
  "animation",
  "animationName",
]);

export const Property = (key: string, val: CSSValue, unit: string = "rem") => {
  // Declaration objects may use kebab-case keys; normalize for set lookups so
  // both spellings receive the same unit handling. Output still uses `reCamel`.
  const name = camel(key);
  const formattedValue = Value(val, {
    rem: !unitlessProperties.has(name),
    second: timeProperties.has(name),
    quote: toQuote.has(name),
    delimeter: commaSeparatedProperties.has(name) ? ", " : " ",
    unit,
  });

  return `${reCamel(key)}: ${formattedValue};`;
};
