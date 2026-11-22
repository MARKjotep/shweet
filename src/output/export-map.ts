import { writeFileSync } from "node:fs";
import type { Mapped } from "@ohmyqt/u";

/**
 * Words that cannot be used as `const` binding names in a module. `eval` and
 * `arguments` are included because module code is strict mode.
 */
const reservedWords = new Set(
  (
    "arguments await break case catch class const continue debugger default " +
    "delete do else enum eval export extends false finally for function if " +
    "implements import in instanceof interface let new null package private " +
    "protected public return static super switch this throw true try typeof " +
    "var void while with yield"
  ).split(" "),
);

const validIdentifier = /^[$_\p{ID_Start}][$\u200c\u200d_\p{ID_Continue}]*$/u;

const isValidExportName = (key: string): boolean =>
  validIdentifier.test(key) && !reservedWords.has(key);

/**
 * Serializes a class/id export map. Keys are sorted by their rendered entry so
 * generated maps stay stable across insertion order.
 *
 * Ordinary class/id names keep the historical `export const name="value"`
 * form. Names that cannot be declared as bindings (reserved words,
 * digit-leading names, or names containing punctuation) are written through a
 * collision-safe local binding and a string-named export alias, which keeps
 * the generated module parseable while preserving the exact consumer key.
 */
export const serializeExportMap = (
  cids: Mapped<string, Set<string>>,
): string => {
  const entries = [...cids.entries()]
    .map(([key, value]) => {
      const serialized = [...value].join(" ");

      return {
        key,
        value: serialized,
        rendered: `${key}="${serialized}"`,
      };
    })
    .sort((a, b) =>
      a.rendered.localeCompare(b.rendered, undefined, { numeric: true }),
    );

  if (entries.length === 0) return "export {}";

  // Preserve the historical single-declaration output whenever every key is a
  // legal binding name.
  if (entries.every((entry) => isValidExportName(entry.key))) {
    return `export const ${entries.map((entry) => entry.rendered).join()};`;
  }

  // Generated bindings must not shadow a real exported name. The set includes
  // every valid key, and each generated name is reserved before use.
  const usedNames = new Set(
    entries
      .map((entry) => entry.key)
      .filter((key) => isValidExportName(key)),
  );
  let internalIndex = 1;

  const nextInternalName = (): string => {
    let name: string;

    do {
      name = `_x${internalIndex}`;
      internalIndex += 1;
    } while (usedNames.has(name));

    usedNames.add(name);
    return name;
  };

  return entries
    .map((entry) => {
      if (isValidExportName(entry.key)) {
        return `export const ${entry.rendered};`;
      }

      const local = nextInternalName();

      return (
        `const ${local}=${JSON.stringify(entry.value)}; ` +
        `export { ${local} as ${JSON.stringify(entry.key)} };`
      );
    })
    .join("\n");
};

export const writeExportMap = (
  filePath: string,
  cids: Mapped<string, Set<string>>,
): void => {
  writeFileSync(filePath, serializeExportMap(cids));
};
