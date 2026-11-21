import { isString, Mapped } from "../helpers";
import type { CSSinR } from "../type";

export class support {
  value: Mapped<string, CSSinR[]>;
  __: (...css: CSSinR[]) => this;
  constructor(css: CSSinR | string) {
    this.value = new Mapped();
    if (isString(css)) {
      this.value.set(css, []);
    } else {
      Object.entries(css).forEach(([key, value]) => {
        this.value.set(`${key}:${value}`, []);
      });
    }
    this.__ = (...css: CSSinR[]) => {
      this.value.forEach((values) => {
        values.push(...css);
      });
      return this;
    };
  }
}

export function supports(css: CSSinR | string) {
  return new support(css).__;
}
