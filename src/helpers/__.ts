import { isArray, makeID, randomAZ } from "@ohmyqt/u";
import type { obj } from "./types";
import { compareObjects, hasObjectChanges } from "./object";
import * as guards from "./guards";

class returner {
  static arr<T = string>(value?: unknown): T[] {
    return value ? (isArray(value) ? (value as T[]) : ([value] as T[])) : [];
  }

  static num(value: unknown, fallback: number = 0): number {
    const parsed = parseFloat(String(value));
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  static str(value: unknown): string {
    return String(value);
  }

  static arr2obj(value: unknown[], switched: boolean = false) {
    return value.reduce<Record<string, any>>((result, item, index) => {
      if (switched) {
        result[String(item)] = index;
      } else {
        result[index] = item;
      }

      return result;
    }, {});
  }
}

class Formatteer {
  constructor(public val: unknown) {}

  get px() {
    return `${this.val}px`;
  }

  get rem() {
    return `${this.val}rem`;
  }

  get pr() {
    return `${this.val}%`;
  }
}

/**
 * Small public utility namespace preserved from the legacy helper barrel.
 */
export class __ {
  static rand(min: number = 6, max?: number): number {
    if (max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

    return Math.floor(Math.random() * min);
  }

  static fill(count: number, fill: unknown = null) {
    return Array(count).fill(fill);
  }

  static new({
    dom,
    id,
    inner,
  }: {
    dom: keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap;
    id?: string;
    inner?: any;
  }): HTMLElement {
    const element = document.createElement(dom);

    if (id) {
      element.id = id;
    }
    if (inner) {
      element.innerHTML = inner;
    }

    return element;
  }

  static randFrom(source: unknown[] | object) {
    if (isArray(source)) {
      return source[this.rand(0, source.length - 1)];
    }

    const keys = Object.keys(source);
    return keys[this.rand(0, keys.length - 1)];
  }

  static randArray<T>(
    source: T[] = [],
    length: number = 1,
    unique: boolean = false,
  ): T[] {
    const result: T[] = [];
    const seen = unique ? new Set<T>() : null;

    while ((unique ? seen!.size : result.length) < length) {
      const item = source[__.rand(0, source.length - 1)]!;
      if (unique) {
        seen!.add(item);
      } else {
        result.push(item);
      }
    }

    return unique ? [...seen!] : result;
  }

  static randomAZ = randomAZ;

  static makeID = makeID;

  static class(
    attributes: obj<any>,
    ...classes: (string | undefined | boolean)[]
  ) {
    const classList = classes.filter(Boolean) as string[];

    if (attributes?.class) {
      classList.push(
        ...(isArray(attributes.class)
          ? (attributes.class as string[])
          : [attributes.class]),
      );
    }

    if (classList.length) {
      attributes.class = classList;
    }
  }

  static get O() {
    return {
      vals: Object.values,
      keys: Object.keys,
      items: Object.entries,
      has: (target: object, key: PropertyKey) => Object.hasOwn(target, key),
      ass: Object.assign,
      len: (target: object = {}) => Object.keys(target).length,
    };
  }

  static get is() {
    return guards;
  }

  static get return() {
    return returner;
  }

  static isHREF(path: string, href: string): boolean {
    return path === href
      ? true
      : path.startsWith(href) && href !== "/"
        ? true
        : false;
  }

  static sleep = (ms: number = 1000) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  static get screen():
    | "xs"
    | "sm"
    | "smd"
    | "md"
    | "lg"
    | "xl"
    | "xxl"
    | undefined {
    const { innerWidth } = window;
    const mediaQueries = {
      xs: innerWidth <= 480,
      sm: innerWidth >= 480,
      smd: innerWidth >= 624,
      md: innerWidth >= 768,
      lg: innerWidth >= 1024,
      xl: innerWidth >= 1280,
      xxl: innerWidth >= 1536,
    };

    const reversed = Object.entries(mediaQueries).reverse();
    for (const [mediaName, matches] of reversed) {
      if (matches) {
        return mediaName as keyof typeof mediaQueries;
      }
    }

    return undefined;
  }

  bytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const base = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(base));

    return `${parseFloat((bytes / Math.pow(base, index)).toFixed(2))} ${sizes[index]}`;
  }

  static format(value: any) {
    return new Formatteer(value);
  }

  static compareObjects = compareObjects;

  static isObjectUdpated = hasObjectChanges;
}
