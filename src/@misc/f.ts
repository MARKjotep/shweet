import { $$, isArr, isNum, isNumber, isStr, reCamel } from "../@";
import { Value } from "../css/value";
import { CSSValue } from "../types";
import { _Var } from "../var";

class g {
  static minmax(min: CSSValue, max: CSSValue) {
    return `minmax(${Value([min, max], {
      rem: true,
      delimeter: ", ",
    })})`;
  }
  static fitContent(len: CSSValue) {
    return `fit-content(${Value([len], {
      rem: true,
    })})`;
  }
  static repeat(count: CSSValue, ...tracks: CSSValue[]) {
    return `repeat(${Value(
      [
        count,
        Value([tracks], {
          rem: true,
        }),
      ],
      {
        delimeter: ", ",
      },
    )})`;
  }
}

export class f extends g {
  static attr(name: CSSValue, type?: CSSValue, fallback?: CSSValue) {
    return `attr(${Value([name, type, fallback])})`;
  }
  static blur(blur: CSSValue) {
    return `blur(${Value([blur], { rem: true })})`;
  }
  static brightness(brightness: CSSValue) {
    return `brightness(${Value([brightness])})`;
  }
  static calc(...calc: CSSValue[]) {
    return `calc(${Value(calc, { rem: true })})`;
  }
  static circle(radius: CSSValue, position?: CSSValue) {
    return `circle(${Value([radius, position], { rem: true })})`;
  }

  static clamp(min: CSSValue, preferred: CSSValue, max: CSSValue) {
    return `clamp(${Value([min, preferred, max], { rem: true, delimeter: ", " })})`;
  }

  /**
   *
   * @param colorInterpolation in + srgb, srgb-linear, display-p3, a98-rgb, prophoto-rgb, rec2020, lab, oklab, xyz, xyz-d50, xyz-d65, hsl, hwb, lch, and oklch
   * @param color1 color, mix%
   * @param color2 color,  mix%
   */
  static colorMix(
    colorInterpolation: CSSValue,
    color1: CSSValue | CSSValue[],
    color2: CSSValue | CSSValue[],
  ) {
    return `color-mix(${Value(
      [
        colorInterpolation,
        Value(isArr(color1) ? color1 : [color1]),
        Value(isArr(color2) ? color2 : [color2]),
      ],
      { delimeter: ", " },
    )})`;
  }

  static conicGradient(...sfs: CSSValue[]) {
    return `conic-gradient(${Value(sfs, {
      delimeter: ", ",
    })})`;
  }
  static contrast(contrast: CSSValue) {
    return `contrast(${Value([contrast])})`;
  }

  /**
   * Numeric values. x1 and x2 must be a number from 0 to 1
   */
  static cubicBezier(x1: CSSValue, y1: CSSValue, x2: CSSValue, y2: CSSValue) {
    return `cubic-bezier(${Value([x1, y1, x2, y2], { delimeter: ", " })})`;
  }
  /**
   * @param sfs h-shadow v-shadow blur spread color
   */
  static dropShadow(...sfs: CSSValue[]) {
    return `drop-shadow(${Value(sfs, { rem: true })})`;
  }

  static grayscale(grayscale: CSSValue) {
    return `grayscale(${Value([grayscale])})`;
  }

  static hsl(hue: CSSValue, saturation: CSSValue, lightness: CSSValue) {
    return `hsl(${Value([hue, saturation, lightness])})`;
  }
  static hsla(
    hue: CSSValue,
    saturation: CSSValue,
    lightness: CSSValue,
    A?: CSSValue,
  ) {
    return `hsl(${Value([hue, saturation, lightness, A ? ["/", A] : A])})`;
  }

  static hueRotate(degree: CSSValue) {
    return `hue-rotate(${Value([degree], {
      degree: true,
    })})`;
  }
  static inset(...sfs: CSSValue[]) {
    return `inset(${Value(sfs, { rem: true })})`;
  }
  static invert(percent: CSSValue) {
    return `invert(${Value([percent])})`;
  }
  static linearGradient(...sfs: CSSValue[]) {
    return `linear-gradient(${Value(sfs, {
      // delim_arr: false,
      delimeter: ", ",
    })})`;
  }
  static matrix(
    scaleX: CSSValue,
    skewY: CSSValue,
    skewX: CSSValue,
    scaleY: CSSValue,
    translateX: CSSValue,
    translateY: CSSValue,
  ) {
    return `matrix(${Value(
      [scaleX, skewY, skewX, scaleY, translateX, translateY],
      {
        delimeter: ", ",
      },
    )})`;
  }
  static matrix3d(
    a1: CSSValue[],
    a2: CSSValue[],
    a3: CSSValue[],
    t4: CSSValue[],
  ) {
    return `matrix3d(${Value([a1, a2, a3, t4], {
      delimeter: ", ",
    })})`;
  }
  static max(...sfs: CSSValue[]) {
    return `max(${Value(sfs, {
      rem: true,
      delimeter: ", ",
    })})`;
  }
  static min(...sfs: CSSValue[]) {
    return `min(${Value(sfs, {
      rem: true,
      delimeter: ", ",
    })})`;
  }
  static opacity(percent: CSSValue) {
    return `opacity(${Value([percent])})`;
  }

  static path(path: CSSValue): string {
    return `path(${Value([path], { quote: true })})`;
  }
  static clipPath(fillRule: CSSValue, path: CSSValue): string {
    return `path(${Value([fillRule, Value([path], { quote: true })], { delimeter: ", " })})`;
  }
  static perspective(value: CSSValue) {
    return `perspective(${Value([value])})`;
  }
  static polygon(...lengths: CSSValue[]) {
    return `polygon(${Value(lengths, {
      percent: true,
      delimeter: ", ",
    })})`;
  }

  static ray(...sfs: CSSValue[]): string {
    return `ray(${Value(sfs, { degree: true })})`;
  }

  static radialGradient(...sfs: CSSValue[]) {
    return `radial-gradient(${Value(sfs, {
      delimeter_arr: ", ",
      percent: true,
      delimeter: ", ",
    })})`;
  }
  static repeatingConicGradient(...sfs: CSSValue[]) {
    return `repeating-conic-gradient(${Value(sfs, {
      degree: true,
      delimeter: ", ",
    })})`;
  }
  static repeatingLinearGradient(...sfs: CSSValue[]) {
    return `repeating-linear-gradient(${Value(sfs, {
      degree: true,
      delimeter: ", ",
    })})`;
  }
  static repeatingRadialGradient(...sfs: CSSValue[]) {
    return `repeating-radial-gradient(${Value(sfs, {
      degree: true,
      delimeter: ", ",
    })})`;
  }

  //
  static rgb(R: CSSValue, G: CSSValue, B: CSSValue) {
    return `rgb(${Value([R, G, B])})`;
  }
  static rgba(R: CSSValue, G: CSSValue, B: CSSValue, A?: CSSValue) {
    return `rgba(${Value([R, G, B, A ? ["/", A] : undefined], {
      delimeter_arr: " ",
    })})`;
  }
  static rotate(R: CSSValue) {
    return `rotate(${Value([R], {
      degree: true,
    })})`;
  }
  static rotate3d(x: CSSValue, y: CSSValue, z: CSSValue, angle: CSSValue) {
    const r3 = Value(
      [
        Value([x, y, z], {
          delimeter: ", ",
        }),
        angle,
      ],
      {
        degree: true,
        delimeter: ", ",
      },
    );
    return `rotate3d(${r3})`;
  }
  static rotateX(X: CSSValue) {
    return `rotateX(${Value([X], {
      degree: true,
    })})`;
  }
  static rotateY(Y: CSSValue) {
    return `rotateY(${Value([Y], {
      degree: true,
    })})`;
  }
  static rotateZ(Z: CSSValue) {
    return `rotateZ(${Value([Z], {
      degree: true,
    })})`;
  }
  static saturate(...sfs: CSSValue[]) {
    return `saturate(${Value(sfs)})`;
  }
  static scale(sx: CSSValue, sy?: CSSValue) {
    return `scale(${Value([sx, sy], { delimeter: ", " })})`;
  }
  static scale3d(sx: CSSValue, sy: CSSValue, sz: CSSValue) {
    return `scale3d(${Value([sx, sy, sz], {
      delimeter: ", ",
    })})`;
  }
  static scaleX(X: CSSValue) {
    return `scaleX(${Value([X])})`;
  }
  static scaleY(Y: CSSValue) {
    return `scaleY(${Value([Y])})`;
  }
  static scaleZ(Z: CSSValue) {
    return `scaleZ(${Value([Z])})`;
  }
  static sepia(percent: CSSValue) {
    return `sepia(${Value([percent])})`;
  }
  static skew(...sfs: CSSValue[]) {
    return `skew(${Value(sfs, {
      degree: true,
      delimeter: ", ",
    })})`;
  }
  static skewX(X: CSSValue) {
    return `skewX(${Value([X], {
      degree: true,
    })})`;
  }
  static skewY(Y: CSSValue) {
    return `skewY(${Value([Y], {
      degree: true,
    })})`;
  }

  static steps(
    n: CSSValue,
    position:
      | "start"
      | "end"
      | "no"
      | "jump-start"
      | "jump-end"
      | "jump-none"
      | "jump-both",
  ) {
    return `steps(${Value([n, position], { delimeter: ", " })})`;
  }
  /**
   * Translate(X,Y)
   */
  static translate(...sfs: CSSValue[]) {
    return `translate(${Value(sfs, {
      rem: true,
      delimeter: ", ",
    })})`;
  }
  static translate3d(...sfs: CSSValue[]) {
    return `translate3d(${Value(sfs, {
      rem: true,
      delimeter: ", ",
    })})`;
  }
  static translateX(X: CSSValue) {
    return `translateX(${Value([X], {
      rem: true,
    })})`;
  }
  static translateY(Y: CSSValue) {
    return `translateY(${Value([Y], {
      rem: true,
    })})`;
  }
  static translateZ(...sfs: CSSValue[]) {
    return `translateZ(${Value(sfs, {
      rem: true,
      delimeter: ", ",
    })})`;
  }
  static url(url: CSSValue) {
    return `url(${Value([url], { quote: true })})`;
  }
  static var(st: string, opt: CSSValue = "") {
    st = "--" + reCamel(st);
    let _opt = opt
      ? ", " +
        Value([opt], {
          rem: true,
          delimeter: ", ",
        })
      : "";
    return `var(${Value([st], { rem: true })}${_opt})`;
  }
}
