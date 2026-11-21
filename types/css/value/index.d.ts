import type { CSSValue } from "../../type";
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
export declare const Value: (val: CSSValue | undefNull, cfg?: propCfg) => string;
export {};
