import type { obj } from "../helpers";
import type { mtype } from "../media";
export type PMtype = keyof mtype;
export type PPRP = Record<string, obj<string[]>>;
export { Loader } from "./compiler";
export { toProperty } from "./serialize";
