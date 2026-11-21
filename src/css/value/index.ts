import {
  isArray,
  isDefined,
  isNull,
  isString,
  isUndefined,
} from "@ohmyqt/u";
import { isNumber } from "../../helpers";
import type { CSSValue } from "../../type";
import { _Var } from "../../var";

interface propCfg {
  rem?: boolean;
  degree?: boolean;
  quote?: boolean;
  delimeter?: string;
  percent?: boolean;
  second?: boolean;
  delimeter_arr?: string;
  percent_arr?: string;
  unit?: string;
}

type undefNull = CSSValue | undefined | null | undefNull[];
export const Value = (
  val: CSSValue | undefNull,
  cfg: propCfg = {
    unit: "rem",
  },
): string => {
  let { rem, second, quote, degree, percent, delimeter, unit, delimeter_arr } =
    cfg;

  if (isUndefined(val) || isNull(val) || (!quote && val === "")) return "";
  const _val = isArray(val) ? val : [val];
  if (!_val.length) return "";

  return _val
    .filter((m) => isDefined(m))
    .map((m) => {
      if (isArray(m)) {
        delimeter = delimeter_arr || ", ";
        return Value(m, { ...cfg, delimeter: " " });
      }

      if (m instanceof _Var) {
        return m.__();
      }

      if (quote) {
        m = String(m);
      }

      if (isNumber(m)) {
        if (rem) {
          return `${m}${unit ? unit : "rem"}`;
        } else if (degree) {
          return `${m}deg`;
        } else if (percent) {
          return `${m}%`;
        } else if (second) {
          return `${m}s`;
        } else {
          return String(m);
        }
        //
      }

      if (isString(m)) {
        if (m.includes("(")) {
          return m;
        } else if (quote) {
          return `'${m}'`;
        } else {
          return m;
        }
      }

      return "";
    })
    .filter((f) => isDefined(f) && f !== "")
    .join(delimeter || " ");
};
