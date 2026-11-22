# REPORT-3 — 0.0.37 release finalization

## Result

- Version bumped `0.0.36` → `0.0.37` (patch/bugfix release).
- Release commit: **`4d56b19`** — `fix: harden src selectors, export maps, minifier, and packaging for npm publish (0.0.37)`.
- Not pushed. `npm publish` was not run.

## Commit contents (22 files, +1077 / −80)

- Source: `src/css/collect.ts`, `src/css/property/index.ts`, `src/css/selectors/proc/index.ts`, `src/output/export-map.ts`, `src/output/minify.ts`, `src/output/save.ts`
- Tests: `test/compiler.test.ts`, `test/declaration-syntax.test.ts`, `test/package-smoke.ts`, `test/selector-output-syntax.test.ts`
- Packaging/build: `builder.ts`, `package.json`, `tsconfig.json`, `dist/index.js`, `dist/index.d.ts`, `types/output/export-map.d.ts`, deleted `types/helpers/mapped.d.ts`
- New tracked files: `LICENSE`, `.ai/tasks/TASK-1.md`, `.ai/tasks/TASK-2.md`, `.ai/reports/REPORT-1.md`, `.ai/reports/REPORT-2.md`

## Validation

```text
$ bun builder.ts
builder @ 3:59:41 PM
BUILDER_EXIT=0

$ bun test
156 pass
0 fail
707 expect() calls
Ran 156 tests across 14 files.

$ bunx tsc -p tsconfig.json --noEmit
TSC_EXIT=0

$ npm pack --dry-run
shweet@0.0.37
filename: shweet-0.0.37.tgz
total files: 5
```

Packed contents were exactly:

1. `LICENSE`
2. `README.md`
3. `dist/index.d.ts`
4. `dist/index.js`
5. `package.json`

No publish and no push were performed.
