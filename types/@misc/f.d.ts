import type { CSSValue } from "../type";
declare class g {
    static minmax(min: CSSValue, max: CSSValue): string;
    static fitContent(len: CSSValue): string;
    static repeat(count: CSSValue, ...tracks: CSSValue[]): string;
}
export declare class f extends g {
    static attr(name: CSSValue, type?: CSSValue, fallback?: CSSValue): string;
    static blur(blur: CSSValue): string;
    static brightness(brightness: CSSValue): string;
    static calc(...calc: CSSValue[]): string;
    static circle(radius: CSSValue, position?: CSSValue): string;
    static clamp(min: CSSValue, preferred: CSSValue, max: CSSValue): string;
    /**
     *
     * @param colorInterpolation in + srgb, srgb-linear, display-p3, a98-rgb, prophoto-rgb, rec2020, lab, oklab, xyz, xyz-d50, xyz-d65, hsl, hwb, lch, and oklch
     * @param color1 color, mix%
     * @param color2 color,  mix%
     */
    static colorMix(colorInterpolation: CSSValue, color1: CSSValue | CSSValue[], color2: CSSValue | CSSValue[]): string;
    static conicGradient(...sfs: CSSValue[]): string;
    static contrast(contrast: CSSValue): string;
    /**
     * Numeric values. x1 and x2 must be a number from 0 to 1
     */
    static cubicBezier(x1: CSSValue, y1: CSSValue, x2: CSSValue, y2: CSSValue): string;
    /**
     * @param sfs h-shadow v-shadow blur spread color
     */
    static dropShadow(...sfs: CSSValue[]): string;
    static grayscale(grayscale: CSSValue): string;
    static hsl(hue: CSSValue, saturation: CSSValue, lightness: CSSValue): string;
    static hsla(hue: CSSValue, saturation: CSSValue, lightness: CSSValue, A?: CSSValue): string;
    static hueRotate(degree: CSSValue): string;
    static inset(...sfs: CSSValue[]): string;
    static invert(percent: CSSValue): string;
    static linearGradient(...sfs: CSSValue[]): string;
    static matrix(scaleX: CSSValue, skewY: CSSValue, skewX: CSSValue, scaleY: CSSValue, translateX: CSSValue, translateY: CSSValue): string;
    static matrix3d(a1: CSSValue[], a2: CSSValue[], a3: CSSValue[], t4: CSSValue[]): string;
    static max(...sfs: CSSValue[]): string;
    static min(...sfs: CSSValue[]): string;
    static opacity(percent: CSSValue): string;
    static path(path: CSSValue): string;
    static clipPath(fillRule: CSSValue, path: CSSValue): string;
    static perspective(value: CSSValue): string;
    static polygon(...lengths: CSSValue[]): string;
    static ray(...sfs: CSSValue[]): string;
    static radialGradient(...sfs: CSSValue[]): string;
    static repeatingConicGradient(...sfs: CSSValue[]): string;
    static repeatingLinearGradient(...sfs: CSSValue[]): string;
    static repeatingRadialGradient(...sfs: CSSValue[]): string;
    static rgb(R: CSSValue, G: CSSValue, B: CSSValue): string;
    static rgba(R: CSSValue, G: CSSValue, B: CSSValue, A?: CSSValue): string;
    static rotate(R: CSSValue): string;
    static rotate3d(x: CSSValue, y: CSSValue, z: CSSValue, angle: CSSValue): string;
    static rotateX(X: CSSValue): string;
    static rotateY(Y: CSSValue): string;
    static rotateZ(Z: CSSValue): string;
    static saturate(...sfs: CSSValue[]): string;
    static scale(sx: CSSValue, sy?: CSSValue): string;
    static scale3d(sx: CSSValue, sy: CSSValue, sz: CSSValue): string;
    static scaleX(X: CSSValue): string;
    static scaleY(Y: CSSValue): string;
    static scaleZ(Z: CSSValue): string;
    static sepia(percent: CSSValue): string;
    static skew(...sfs: CSSValue[]): string;
    static skewX(X: CSSValue): string;
    static skewY(Y: CSSValue): string;
    static steps(n: CSSValue, position: "start" | "end" | "no" | "jump-start" | "jump-end" | "jump-none" | "jump-both"): string;
    /**
     * Translate(X,Y)
     */
    static translate(...sfs: CSSValue[]): string;
    static translate3d(...sfs: CSSValue[]): string;
    static translateX(X: CSSValue): string;
    static translateY(Y: CSSValue): string;
    static translateZ(...sfs: CSSValue[]): string;
    static url(url: CSSValue): string;
    static format(format: string): string;
    static var(st: string, opt?: CSSValue): string;
}
export {};
