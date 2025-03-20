import { CSSinR, CSSValue } from "../types";
import { $$, isObj, isStr, oAss, obj, oItems, V } from "../@";

import { _Var } from "../var";
import { med, media, Medyas } from "../media";
import { support } from "../support";

function _pseu(sel: string) {
  return function (
    ...itm: (CSSinR | _Var | support | obj<CSSValue> | Medyas<any>)[]
  ) {
    return { [sel]: itm };
  };
}

export class ps {
  static attr(d: obj<string>) {
    const [k, v] = oItems(d)[0];
    return _pseu(`[${k}="${v}"]`);
  }
  //# Pseudo Elements -----------------------
  static after(xx: V = "") {
    return _pseu("::after" + xx);
  }
  static before(xx: V = "") {
    return _pseu("::before" + xx);
  }
  static backdrop(xx: V = "") {
    return _pseu("::backdrop" + xx);
  }
  static cue(xx: V = "") {
    return _pseu("::cue" + xx);
  }
  static cueRegion(xx: V = "") {
    return _pseu("::cue-region" + xx);
  }
  static firstLetter(xx: V = "") {
    return _pseu("::first-letter" + xx);
  }
  static firstLine(xx: V = "") {
    return _pseu("::first-line" + xx);
  }
  static marker(xx: V = "") {
    return _pseu("::marker" + xx);
  }
  static part(xx: V = "") {
    return _pseu("::part" + xx);
  }
  static placeholder(xx: V = "") {
    return _pseu("::placeholder" + xx);
  }
  static selection(xx: V = "") {
    return _pseu("::selection" + xx);
  }
  static slotted(xx: V = "") {
    return _pseu("::slotted" + xx);
  }
  static spellingError(xx: V = "") {
    return _pseu("::spelling-error" + xx);
  }
  static targetText(xx: V = "") {
    return _pseu("::target-text" + xx);
  }
  static viewTransition(xx: V = "") {
    return _pseu("::view-transition" + xx);
  }
  static viewTransitionGroup(xx: V = "") {
    return _pseu("::view-transition-group" + xx);
  }
  static viewTransitionImagePair(xx: V = "") {
    return _pseu("::view-transition-image-pair" + xx);
  }
  static viewTransitionNew(xx: V = "") {
    return _pseu("::view-transition-new" + xx);
  }
  static viewTransitionOld(xx: V = "") {
    return _pseu("::view-transition-old" + xx);
  }

  //# Scrollbar -----------------------
  static scrollbar(xx: V = "") {
    return _pseu("::-webkit-scrollbar" + xx);
  }
  static scrollbarThumb(xx: V = "") {
    return _pseu("::-webkit-scrollbar-thumb" + xx);
  }
  static scrollbarTrack(xx: V = "") {
    return _pseu("::-webkit-scrollbar-track" + xx);
  }

  static scrollbarCorner(xx: V = "") {
    return _pseu("::-webkit-scrollbar-corner" + xx);
  }
  //# Pseudo Classes -----------------------
  static active(xx: V = "") {
    return _pseu(":active" + xx);
  }
  static anyLink(xx: V = "") {
    return _pseu(":any-link" + xx);
  }
  static autofill(xx: V = "") {
    return _pseu(":autofill" + xx);
  }
  static blank(xx: V = "") {
    return _pseu(":blank" + xx);
  }
  static checked(xx: V = "") {
    return _pseu(":checked" + xx);
  }
  static current(xx: V = "") {
    return _pseu(":current" + xx);
  }
  static default(xx: V = "") {
    return _pseu(":default" + xx);
  }
  static defined(xx: V = "") {
    return _pseu(":defined" + xx);
  }
  static disabled(xx: V = "") {
    return _pseu(":disabled" + xx);
  }
  static empty(xx: V = "") {
    return _pseu(":empty" + xx);
  }
  static enabled(xx: V = "") {
    return _pseu(":enabled" + xx);
  }
  static first(xx: V = "") {
    return _pseu(":first" + xx);
  }
  static firstChild(xx: V = "") {
    return _pseu(":first-child" + xx);
  }
  static firstOfType(xx: V = "") {
    return _pseu(":first-of-type" + xx);
  }
  static fullscreen(xx: V = "") {
    return _pseu(":fullscreen" + xx);
  }
  static future(xx: V = "") {
    return _pseu(":future" + xx);
  }
  static focus(xx: V = "") {
    return _pseu(":focus" + xx);
  }
  static focusVisible(xx: V = "") {
    return _pseu(":focus-visible" + xx);
  }
  static focusWithin(xx: V = "") {
    return _pseu(":focus-within" + xx);
  }
  static host(xx: V = "") {
    return _pseu(":host" + xx);
  }
  static hover(xx: V = "") {
    return _pseu(":hover" + xx);
  }
  static indeterminate(xx: V = "") {
    return _pseu(":indeterminate" + xx);
  }
  static inRange(xx: V = "") {
    return _pseu(":in-range" + xx);
  }
  static invalid(xx: V = "") {
    return _pseu(":invalid" + xx);
  }
  static lastChild(xx: V = "") {
    return _pseu(":last-child" + xx);
  }
  static lastOfType(xx: V = "") {
    return _pseu(":last-of-type" + xx);
  }
  static left(xx: V = "") {
    return _pseu(":left" + xx);
  }
  static link(xx: V = "") {
    return _pseu(":link" + xx);
  }
  static localLink(xx: V = "") {
    return _pseu(":local-link" + xx);
  }
  static modal(xx: V = "") {
    return _pseu(":modal" + xx);
  }
  static onlyChild(xx: V = "") {
    return _pseu(":only-child" + xx);
  }
  static onlyOfType(xx: V = "") {
    return _pseu(":only-of-type" + xx);
  }
  static optional(xx: V = "") {
    return _pseu(":optional" + xx);
  }
  static outOfRange(xx: V = "") {
    return _pseu(":out-of-range" + xx);
  }
  static past(xx: V = "") {
    return _pseu(":past" + xx);
  }
  static pictureInPicture(xx: V = "") {
    return _pseu(":picture-in-picture" + xx);
  }
  static placeholderShown(xx: V = "") {
    return _pseu(":placeholder-shown" + xx);
  }
  static paused(xx: V = "") {
    return _pseu(":paused" + xx);
  }
  static playing(xx: V = "") {
    return _pseu(":playing" + xx);
  }
  static readOnly(xx: V = "") {
    return _pseu(":read-only" + xx);
  }
  static readWrite(xx: V = "") {
    return _pseu(":read-write" + xx);
  }
  static required(xx: V = "") {
    return _pseu(":required" + xx);
  }
  static right(xx: V = "") {
    return _pseu(":right" + xx);
  }
  static root(xx: V = "") {
    return _pseu(":root" + xx);
  }
  static scope(xx: V = "") {
    return _pseu(":scope" + xx);
  }
  static target(xx: V = "") {
    return _pseu(":target" + xx);
  }
  static targetWithin(xx: V = "") {
    return _pseu(":target-within" + xx);
  }
  static userInvalid(xx: V = "") {
    return _pseu(":user-invalid" + xx);
  }
  static valid(xx: V = "") {
    return _pseu(":valid" + xx);
  }
  static visited(xx: V = "") {
    return _pseu(":visited" + xx);
  }
  //   Functions ---------------
  static dir(xx: V) {
    return _pseu(`:dir(${xx})`);
  }
  static has(xx: V) {
    return _pseu(`:has(${xx})`);
  }
  static host_(xx: V) {
    return _pseu(`:host(${xx})`);
  }
  static hostContext(xx: V) {
    return _pseu(`:host-context(${xx})`);
  }
  static is(xx: V) {
    return _pseu(`:is(${xx})`);
  }
  static lang(xx: V) {
    return _pseu(`:lang(${xx})`);
  }
  static not(xx: V) {
    return _pseu(`:not(${xx})`);
  }
  static nthChild(xx: V) {
    return _pseu(`:nth-child(${xx})`);
  }
  static nthCol(xx: V) {
    return _pseu(`:nth-col(${xx})`);
  }
  static nthLastChild(xx: V) {
    return _pseu(`:nth-last-child(${xx})`);
  }
  static nthLastCol(xx: V) {
    return _pseu(`:nth-last-col(${xx})`);
  }
  static nthLastOfType(xx: V) {
    return _pseu(`:nth-last-of-type(${xx})`);
  }
  static nthOfType(xx: V) {
    return _pseu(`:nth-of-type(${xx})`);
  }
  static state(xx: V) {
    return _pseu(`:state(${xx})`);
  }
  static where(xx: V) {
    return _pseu(`:where(${xx})`);
  }

  // Combinators  -------------

  static and(str: string) {
    return _pseu(", " + str);
  }
  static child(str: string) {
    return _pseu(" > " + str);
  }
  static desc(str: string) {
    return _pseu(" " + str);
  }

  static next(str: string) {
    return _pseu(" + " + str);
  }
  static general(str: string) {
    return _pseu(" ~ " + str);
  }
  static withClass(str: string) {
    if (!str.startsWith(".")) {
      throw Error("should start with . or # - class / id");
    }
    return _pseu(str);
  }
}
