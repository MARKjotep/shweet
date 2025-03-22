import { isStr, Mapper, oItems } from "../@";
import { CSSinR } from "../type";

export class support {
  value: Mapper<string, CSSinR[]>;
  __: (...css: CSSinR[]) => this;
  constructor(css: CSSinR | string) {
    this.value = new Mapper();
    if (isStr(css)) {
      this.value.set(css, []);
    } else {
      oItems(css).forEach(([k, v]) => {
        this.value.set(`${k}:${v}`, []);
      });
    }
    this.__ = (...css: CSSinR[]) => {
      this.value.forEach((v) => {
        v.push(...css);
      });
      return this;
    };
  }
}

export function supports(css: CSSinR | string) {
  return new support(css).__;
}
