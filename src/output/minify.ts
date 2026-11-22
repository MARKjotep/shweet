/**
 * Whitespace minification with a bounded token scanner.
 *
 * The scanner is intentionally not a CSS parser. It protects input regions
 * where ordinary punctuation/whitespace rewriting would be unsafe (quoted
 * strings, `url(...)` payloads, custom property values, and math functions)
 * and copies everything else conservatively.
 */

const isWhitespace = (character: string | undefined): boolean =>
  character !== undefined && /\s/.test(character);

const isIdentifierCharacter = (character: string | undefined): boolean =>
  character !== undefined &&
  (/[a-zA-Z0-9_-]/.test(character) || character.charCodeAt(0) >= 0x80);

const isDigit = (character: string | undefined): boolean =>
  character !== undefined && character >= "0" && character <= "9";

const isIdentifierStart = (character: string | undefined): boolean =>
  character !== undefined &&
  (/[a-zA-Z_-]/.test(character) || character.charCodeAt(0) >= 0x80);

const readIdentifierEnd = (css: string, start: number): number => {
  let index = start;

  while (index < css.length) {
    const character = css[index]!;

    if (character === "\\") {
      index += Math.min(2, css.length - index);
      continue;
    }

    if (!isIdentifierCharacter(character)) break;
    index += 1;
  }

  return index;
};

/* Punctuation whose surrounding whitespace the previous minifier removed. */
const COLLAPSIBLE_PUNCTUATION = new Set(["{", "}", ";", ",", ">", "~"]);

/* Functions where whitespace around `+` and `-` is required by CSS syntax. */
const MATH_FUNCTION = /^(?:calc|min|max|clamp|hypot|round|mod|rem|abs|sign|sqrt|pow|log|exp|sin|cos|tan|asin|acos|atan|atan2)\(/i;

const URL_FUNCTION = /^url\(/i;

/**
 * Comments are not whitespace, so removing one can join two tokens that were
 * separate (as in `a` + comment + `b`), which must not become `ab`. This checks the small set of
 * joins that would change tokenization; anything else can be removed cleanly.
 */
const needsCommentSeparator = (
  previous: string | undefined,
  next: string | undefined,
): boolean => {
  if (previous === undefined || next === undefined) return false;

  if (isIdentifierCharacter(previous) && isIdentifierCharacter(next)) {
    return true;
  }
  if (isDigit(previous) && next === ".") return true;
  if (previous === "." && isDigit(next)) return true;
  if (previous === "#" && isIdentifierCharacter(next)) return true;
  if (previous === "@" && isIdentifierCharacter(next)) return true;
  if (isIdentifierCharacter(previous) && next === "(") return true;
  if (isDigit(previous) && next === "%") return true;
  if (previous === "/" && next === "*") return true;

  return false;
};

const shouldDropSpace = (
  previous: string,
  next: string,
  insideMathFunction: boolean,
): boolean => {
  // In `calc()` and similar functions, `+` and `-` require whitespace on both
  // sides. Their spaces therefore remain single spaces instead of collapsing.
  if (insideMathFunction && (previous === "+" || previous === "-")) {
    return false;
  }
  if (insideMathFunction && (next === "+" || next === "-")) return false;

  // Whitespace before a colon is a descendant combinator in selectors
  // (`.a :hover`) and harmless in declarations (`.a { color : red }`), so it
  // must never be dropped. Whitespace after a colon is still removed.
  if (next === ":") return false;
  if (previous === ":") return true;

  if (next === "+") return true;
  if (previous === "+") return true;

  return COLLAPSIBLE_PUNCTUATION.has(previous) || COLLAPSIBLE_PUNCTUATION.has(next);
};

export const minifyCss = (css: string): string => {
  let output = "";
  let index = 0;
  let pendingSpace = false;
  let declarationStart = false;
  let attributeDepth = 0;
  const mathFunctions: boolean[] = [];
  let mathDepth = 0;

  const flushSpace = (next: string) => {
    if (!pendingSpace) return;
    pendingSpace = false;

    if (output.length === 0) return;
    const previous = output[output.length - 1]!;

    if (!shouldDropSpace(previous, next, mathDepth > 0)) output += " ";
  };

  const copyString = (start: number): number => {
    const quote = css[start]!;
    let end = start + 1;

    while (end < css.length) {
      const character = css[end]!;

      if (character === "\\") {
        end += Math.min(2, css.length - end);
        continue;
      }

      end += 1;
      if (character === quote) break;
    }

    output += css.slice(start, end);
    return end;
  };

  const copyUrl = (start: number, openParenthesis: number): number => {
    let end = openParenthesis + 1;
    let depth = 1;
    let quote: string | undefined;

    while (end < css.length) {
      const character = css[end]!;

      if (quote !== undefined) {
        if (character === "\\") {
          end += Math.min(2, css.length - end);
          continue;
        }
        end += 1;
        if (character === quote) quote = undefined;
        continue;
      }

      if (character === "\\") {
        end += Math.min(2, css.length - end);
        continue;
      }

      if (character === '"' || character === "'") {
        quote = character;
        end += 1;
        continue;
      }

      if (character === "(") {
        depth += 1;
      } else if (character === ")") {
        depth -= 1;
        end += 1;
        if (depth === 0) break;
        continue;
      }

      end += 1;
    }

    output += css.slice(start, end);
    return end;
  };

  /**
   * Finds the end of a custom property value without interpreting any of its
   * token content. Leading/trailing whitespace inside the value is preserved,
   * because custom property values can be substituted into `var()`.
   */
  const findCustomPropertyValueEnd = (
    start: number,
    endsAtParenthesis: boolean,
  ): number => {
    let end = start;
    let depth = 0;

    while (end < css.length) {
      const character = css[end]!;

      if (character === "\\") {
        end += Math.min(2, css.length - end);
        continue;
      }

      if (character === '"' || character === "'") {
        const quote = character;
        end += 1;
        while (end < css.length) {
          const quoted = css[end]!;
          if (quoted === "\\") {
            end += Math.min(2, css.length - end);
            continue;
          }
          end += 1;
          if (quoted === quote) break;
        }
        continue;
      }

      if (character === "/" && css[end + 1] === "*") {
        const commentEnd = css.indexOf("*/", end + 2);
        end = commentEnd === -1 ? css.length : commentEnd + 2;
        continue;
      }

      if (depth === 0) {
        if (character === ";" || character === "}") break;
        if (endsAtParenthesis && character === ")") break;
      }

      if (character === "(" || character === "[" || character === "{") {
        depth += 1;
      } else if (character === ")" || character === "]" || character === "}") {
        depth = Math.max(0, depth - 1);
      }

      end += 1;
    }

    return end;
  };

  while (index < css.length) {
    const character = css[index]!;

    if (isWhitespace(character)) {
      pendingSpace = true;
      index += 1;
      continue;
    }

    if (character === "/" && css[index + 1] === "*") {
      const commentEnd = css.indexOf("*/", index + 2);
      const end = commentEnd === -1 ? css.length : commentEnd + 2;
      const comment = css.slice(index, end);
      const significant = /^\/\*[!#@]/.test(comment);

      if (significant) {
        flushSpace("/");
        output += comment;
      } else if (!pendingSpace) {
        const next = css[end];
        if (
          next !== undefined &&
          !isWhitespace(next) &&
          needsCommentSeparator(output[output.length - 1], next)
        ) {
          pendingSpace = true;
        }
      }

      index = end;
      continue;
    }

    if (character === '"' || character === "'") {
      flushSpace(character);
      index = copyString(index);
      declarationStart = false;
      continue;
    }

    // Custom property declarations and custom-property syntax inside
    // `@supports` conditions. Their value token content is copied verbatim.
    if (
      character === "-" &&
      css[index + 1] === "-" &&
      attributeDepth === 0 &&
      (declarationStart || output.endsWith("("))
    ) {
      const nameEnd = readIdentifierEnd(css, index);
      let colon = nameEnd;

      while (isWhitespace(css[colon])) colon += 1;

      if (css[colon] === ":") {
        const valueEnd = findCustomPropertyValueEnd(
          colon + 1,
          !declarationStart,
        );

        // The custom property starts a declaration (after `{`/`;`) or a
        // condition (after `(`), so preceding whitespace is never required.
        pendingSpace = false;
        output += css.slice(index, nameEnd) + ":";
        output += css.slice(colon + 1, valueEnd);
        index = valueEnd;
        declarationStart = false;
        continue;
      }
    }

    if (isIdentifierStart(character)) {
      const identifierEnd = readIdentifierEnd(css, index);
      const identifier = css.slice(index, identifierEnd);
      const functionOpening = css[identifierEnd] === "(";

      if (functionOpening && URL_FUNCTION.test(identifier + "(")) {
        flushSpace(identifier[0]!);
        index = copyUrl(index, identifierEnd);
        declarationStart = false;
        continue;
      }

      if (functionOpening && MATH_FUNCTION.test(identifier + "(")) {
        flushSpace("(");
        output += identifier + "(";
        mathFunctions.push(true);
        mathDepth += 1;
        index = identifierEnd + 1;
        declarationStart = false;
        continue;
      }

      flushSpace(identifier[0]!);
      output += identifier;
      index = identifierEnd;
      declarationStart = false;
      continue;
    }

    if (character === "{") {
      flushSpace(character);
      output += character;
      declarationStart = true;
      index += 1;
      continue;
    }

    if (character === "}") {
      flushSpace(character);
      output += character;
      declarationStart = false;
      index += 1;
      continue;
    }

    if (character === ";") {
      flushSpace(character);
      output += character;
      declarationStart = true;
      index += 1;
      continue;
    }

    if (character === "(") {
      flushSpace(character);
      output += character;
      mathFunctions.push(false);
      index += 1;
      declarationStart = false;
      continue;
    }

    if (character === ")") {
      flushSpace(character);
      output += character;
      if (mathFunctions.pop()) mathDepth -= 1;
      index += 1;
      declarationStart = false;
      continue;
    }

    if (character === "[") {
      attributeDepth += 1;
    } else if (character === "]") {
      attributeDepth = Math.max(0, attributeDepth - 1);
    }

    flushSpace(character);
    output += character;
    index += 1;
    declarationStart = false;
  }

  return output.trimEnd();
};
