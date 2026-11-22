# REPORT-1 — Production review of `src/`

## Summary

- Deep review of all TypeScript modules under `src/` against the review targets in `.ai/plans/plan.md`, with focused probes for selector commas/quoting, prefixing, media isolation, animation hoisting, and minification.
- Fixed seven real correctness issues in `src/` and added nine regression tests; the documented/public API and all previous 145 tests remain intact.
- Validation is green: `bun test` (154 pass / 0 fail), `bunx tsc -p tsconfig.json --noEmit`, and `bun builder.ts` in a temporary project copy (exit 0). Root-owned generated files were not touched.

## Changed files

- `src/css/collect.ts` — selector-token scanning for export maps and the shaker.
- `src/css/selectors/proc/index.ts` — parent selector-list distribution, kebab-case animation properties, array animation values.
- `src/css/property/index.ts` — kebab-case property lookups and comma-separated animation values.
- `src/output/minify.ts` — descendant whitespace before pseudo selectors.
- `src/output/save.ts` — empty `mapDir` entries.
- `test/compiler.test.ts` — export-map/shaker selector-syntax and empty-map-dir regressions.
- `test/declaration-syntax.test.ts` — kebab-case comma property, kebab-case `animation-name`, array animation regressions.
- `test/selector-output-syntax.test.ts` — parent-list suffix/combinator and descendant-pseudo minification regressions.

## Bugs found and fixed

1. **Export maps and shaker matched class/id markers inside protected selector content.**
   `src/css/collect.ts:445` (`getCID`) replaced the previous `/\\.([A-Za-z0-9_-]+)/` style regexes with a bounded scanner (`src/css/collect.ts:233-443`). Before, `[title=".fake, #fakeid"]` added `fake`/`fakeid` entries, and `escaped\\.dot` produced `escaped` plus a bogus `dot`. Now quoted strings, comments, and attribute selectors are ignored; escapes are decoded for keys but kept raw for emitted values (`escaped_dot="p_escaped\\.dot"`). The shaker uses the same safe token list, so class-like text in attribute values no longer retains unrelated selectors.

2. **Suffixes and combinators were applied to only the last selector of a parent list.**
   `src/css/selectors/proc/index.ts:69` (`appendSelectorSuffix`) and `:81` (`nestSelectorList`), used at `:177`, `:184`, and `:193`. Before, `d[".a, .b"]` plus `ps.hover()` produced `.a, .b:hover` (dropping `.a:hover`), and `ps.desc(".c")` produced `.a, .b .c`. Now it produces `.a:hover, .b:hover` and `.a .c, .b .c`; comma-list targets are still expanded and functional-pseudo commas remain intact.

3. **Minification removed a meaningful descendant combinator before pseudo selectors.**
   `src/output/minify.ts:90` now never drops whitespace when the next token is `:` (whitespace after `:` is still removed), and the custom-property branch at `:302` clears pending space explicitly. Before, `.a :hover`, `.a ::before`, and `div :is(.x, .y)` minified to `.a:hover`, `.a::before`, and `div:is(.x,.y)`, changing semantics. Generated declaration spacing (`.a{color:red;}`) is unchanged.

4. **Kebab-case animation properties were not recognized.**
   `src/css/selectors/proc/index.ts:114` normalizes the property with `camel` before deciding between shorthand and `animationName` parsing. `{ "animation-name": "bounce" }` now emits the prefixed name and records the keyframe reference, matching camelCase behavior.

5. **Kebab-case property lookup used the raw key for quote/comma options.**
   `src/css/property/index.ts:66-67` now uses the camel-normalized name. `{ "transition-property": ["color", "background"] }` emits `transition-property: color, background;` instead of a space-joined invalid value.

6. **Array animation values prefixed only the first entry and serialized as one invalid shorthand.**
   `src/css/selectors/proc/index.ts:137` prefixes every array entry, and `src/css/property/index.ts:51` treats `animation`/`animationName` as comma-separated. `{ animation: ["bounce 1s", "slide 2s"] }` now emits `animation: p_bounce 1s, p_slide 2s;` and records both keyframe references. Other array properties retain their existing delimiters.

7. **An empty `mapDir` resolved to the filesystem root.**
   `src/output/save.ts:60` skips omitted/empty map-directory entries, mirroring the existing empty-`dir` guard. `save({ mapDir: "" })` no longer attempts `/index.js`.

## Findings verified as non-issues

- **Grouping does not call `split(",")`.** `src/css/group.ts:52-72` keeps each selector expression in an ordered `Set` and only merges adjacent exact declaration sequences. Existing tests cover `:is(...)` and `[title="a,b"]`.
- **Prefixing already protects quoted attribute values, comments, escapes, and escaped punctuation.** `applyPrefix` (`src/css/collect.ts:270-332`) was correct; the export-map extraction was the unsafe counterpart and is now aligned with it.
- **Media-feature isolation was already fixed.** `Loader.load` (`src/css/compiler.ts:38-45`) copies `media.prop`, `media.extra`, and per-instance features instead of mutating shared statics; tests cover separate instances, repeated saves, and intentional static-default changes.
- **Animation/transition hoisting is preserved.** `src/css/serialize.ts:20-26` and `:51-68` still move animation/transition groups to the front of each media bucket; tests assert the behavior and stable keyframe placement.
- **Minifier protections for strings, URLs, comments, custom properties, and math functions were otherwise sound** after the colon fix; existing and new tests cover them.
- **`Proc.splitSelectorList` and declaration-string `splitTopLevel`/`findTopLevel` are already syntax-aware** for quotes, escapes, and nested brackets.
- **`Value`'s nested-array delimiter behavior is unusual but intentional as characterized** by `src/css/value/value.test.ts` (“different delimeters”); it was not changed.
- **Custom media-feature keys containing `-`** remain a documented limitation; no code change.

## Validation

Run from the repository root after the changes:

```text
$ bun test
154 pass
0 fail
692 expect() calls
Ran 154 tests across 14 files.

$ bunx tsc -p tsconfig.json --noEmit
(no output; exit 0)
```

`bun builder.ts` was run in a temporary copy (`rsync` of the project, with `node_modules` symlinked and `.git`/`.ai` excluded) so the pre-existing uncommitted `dist/`, `types/`, `builder.ts`, and `package.json` changes owned by another worker were not overwritten. Result:

```text
builder @ 3:48:57 PM
BUILDER_EXIT=0
```

The temporary copy was removed, and `.tmp-probe/` scratch files created during review were deleted.

## Unresolved issues / notes

- The export map still emits `export const <key>=...`. A class name that is a JavaScript reserved word (for example `default`) or starts with a digit can produce invalid module text. Fixing it changes the public export-map format and/or key naming, so it was left as a follow-up.
- `SaveOptions.includeAnimation` exists but is unused by `save`; removing or implementing it would change public types/behavior and was left alone.
- Assigning a `_Var` still records a conservative `ANIM` entry from the token’s value (affects shaker keyframe retention only, not emitted CSS). This legacy behavior was left unchanged to avoid altering shaker semantics without a dedicated compatibility decision.
- `__` in `src/helpers/__.ts` exposes `bytes` as an instance method while the rest of the namespace is static; left unchanged as a public helper-shape decision.
- Pre-existing uncommitted root changes (`builder.ts`, `package.json`, `dist/`, `types/`, `LICENSE`) were preserved and not edited.

## Correction round 1 (TASK-1 follow-ups)

Both follow-ups from `REPORT-2.md` were addressed within the allowed file scope. No changes were needed in `src/`.

### 1. Fixed `tsconfig.json` `typeRoots` typo

- Changed `"typeRoots": ["node_module/@types"]` to `"node_modules/@types"` in `tsconfig.json:34`.
- Re-ran `bunx tsc -p tsconfig.json --noEmit`: **exit 0, no diagnostics**. Fixing the typo did not surface any previously masked errors in `src/` or `test/`, so no source changes were required.
- `bun test` also remains green: **154 pass, 0 fail**.

### 2. Removed the stale `log` expectation from `test/package-smoke.ts`

`log` is not part of the current public API, so the test was updated rather than the facade:

- Git history shows `log` was re-exported in the prior snapshot (`b13f573:src/index.ts`: `export { log, __ } from "./helpers"`), but the current source (`c266405` and the working tree) exports only `__` from `./helpers`.
- `src/helpers/index.ts` no longer exports a `log` symbol; `log` is only an internal import from `@ohmyqt/u` in `src/css/collect.ts`.
- `test/helpers-api.test.ts` explicitly asserts that `log` is **not** a root export (`expect("log" in shweetApi).toBe(false)`), and `README.md` states Shweet does not re-export `@ohmyqt/u` helpers from its root API.
- `REPORT-2.md` records the built `dist/index.js` public surface as 17 runtime exports, without `log`.

Accordingly, `"log"` was removed from `expectedExports` in `test/package-smoke.ts:359-378`. A direct source import confirms the runtime export list now exactly matches the test's 17-name list. `src/index.ts` was left unchanged.

### Validation after correction

```text
$ bun test
154 pass
0 fail
692 expect() calls
Ran 154 tests across 14 files.

$ bunx tsc -p tsconfig.json --noEmit
(no output; exit 0)
```

`test/package-smoke.ts` itself was not executed in this correction round (it is a manual, non-`*.test.ts` harness); its expected-export list was verified against `Object.keys(await import("./src/index.ts"))`, which returns the same 17 names.

## Correction round 2 (final review verdict)

All three review items were addressed within `src/` + `test/`; no root/generated files were touched.

### 1. Export maps are now always parseable

- `src/output/export-map.ts` now validates each `Mapped` key before emitting it.
- Keys that are valid JavaScript identifiers and not reserved words keep the historical form, and an all-valid map still serializes as one byte-compatible statement (existing export-map tests pass unchanged):
  `export const a="x_a",b="x_b";`
- Reserved words (`default`, `class`, `delete`, …), digit-leading names, and names with identifier-invalid punctuation are emitted as a local declaration plus an ES2022 string-named export alias:
  `const _x1="p_class"; export { _x1 as "class" };`
- Internal names are deterministic (`_x1`, `_x2`, …) and skip every real exported key, so a genuine class named `_x1` cannot be shadowed. Invalid-entry values are emitted through `JSON.stringify` for guaranteed module validity.
- Added a regression test in `test/compiler.test.ts` covering `default`, `class`, `delete`, `1st`, `a-b`, a valid name, and the `_x1` collision. The test writes the generated module to a temporary `.mjs` file and dynamically imports it, verifying both parseability and exact named exports.

### 2. Selector-list splitting ignores comments

- `src/css/selectors/proc/index.ts` `splitSelectorList` now skips `/* ... */` regions when scanning for top-level commas, after quote/escape handling (so comment markers inside strings and escaped slashes are not treated as comments).
- Added a regression in `test/selector-output-syntax.test.ts` using `.a/* keep, comma */, .b` with a hover suffix; the comma inside the comment stays intact and the real list separator still splits.

### 3. Empty `mapDir` regression now asserts no map file

- `test/compiler.test.ts` now uses a unique `mapName`, saves with `mapDir: ""`, and asserts the map file was not created in the CSS temp directory **or** at the old buggy root path (`/<mapName>.js`), in addition to checking the CSS file was written.

### Validation after correction round 2

```text
$ bun test
156 pass
0 fail
707 expect() calls
Ran 156 tests across 14 files.

$ bunx tsc -p tsconfig.json --noEmit
(no output; exit 0)
```

A direct `Shweet.save()` check with classes named `default`, `class`, and `ok` produced:

```js
const _x1="p_class"; export { _x1 as "class" };
const _x2="p_default"; export { _x2 as "default" };
export const ok="p_ok";
```

`src/index.ts` needed no change. `dist/` and `types/` were not regenerated.
