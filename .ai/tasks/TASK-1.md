# TASK-1 — Production-quality review and correctness fixes for `src/`

## Summary

- Deep production-quality review of all TypeScript source in `src/` against the review targets in `.ai/plans/plan.md`.
- Fix real correctness bugs found and add focused regression tests under `test/`; preserve the public API, runtime behavior, and all 145 currently passing tests.
- Result: `src/` validated for production with `bun test` and `tsc --noEmit` green, and `bun builder.ts` still building.

## Objective and relevant files

- Review every module under `src/` (core, css including selectors/proc, output, helpers, media, var, support, type, `@misc`) for production-readiness: correctness, edge cases, dead code that would ship to consumers, and fragile regex/string splitting.
- Focus areas from `.ai/plans/plan.md` ("Findings from the current source"):
  1. Grouping splits selector strings with `split(",")` — verify correctness for commas inside `:is(...)`, `:not(...)`, `:has(...)` and attribute values like `[data-x="a,b"]`.
  2. Prefixing replaces every `.` and `#` in a selector string — verify quoted attribute values and escaped identifiers are handled safely.
  3. The loader mutates shared `media.prop` with custom media features — verify isolation across separate Shweet instances and repeated saves.
  4. Animation/transition blocks are moved ahead of other blocks — preserve this behavior.
  5. Minification/string parsing regexes vs quoted content, URLs, custom properties, `calc()`.

## Allowed files to modify

- `src/**` and `test/**` only. Do NOT touch `package.json`, `.npmignore`, `builder.ts`, `README`, `LICENSE`, `types/`, `dist/`, or any other root file (another worker owns them; `types/` and `dist/` are generated).

## Requirements

- Fix bugs with minimal, correct changes; no unrelated refactoring; no new dependencies.
- Preserve public imports, keys, runtime behavior, and type inference. The plan states the user's confirmed examples and current 145 passing tests are the behavior baseline.
- Add focused regression tests under `test/` for each bug fixed (follow existing test file style, e.g. `test/grouping.test.ts`, `test/selector-output-syntax.test.ts`).
- If a finding turns out to be a non-issue after inspection, note that in the report instead of changing code.

## Constraints and edge cases

- Do not normalize distinct values (e.g. `0` vs `0px`) merely to merge declarations (per plan).
- Do not silently rewrite minification/string-parsing into new logic; only fix demonstrated incorrectness.
- Quoted strings in selectors/declarations must never be corrupted.

## Acceptance criteria and validation

- `bun test` → all tests pass (previous baseline: 145 pass, 0 fail; should be ≥ baseline plus new regression tests).
- `bunx tsc -p tsconfig.json --noEmit` → no errors.
- `bun builder.ts` completes successfully (do not modify it; just confirm it still builds).
- Report: changed files, bugs found and fixed (with file:line), findings verified as non-issues, validation output summary, unresolved issues.
