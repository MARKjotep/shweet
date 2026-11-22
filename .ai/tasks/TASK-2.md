# TASK-2 — Build pipeline verification and publish metadata audit

## Summary

- Verify the `builder.ts` build pipeline end-to-end and audit the generated `dist/` output (index.js + index.d.ts) for npm consumption.
- Fix package.json publish metadata (missing `exports` map, thin `keywords`) and add the missing `LICENSE` file.
- Validate with `npm pack --dry-run` that the published tarball is correct.
- Smoke-test the built package from outside the project with Node (fall back to Bun) to prove consumers can import and use it.

## Objective and relevant files

- `builder.ts` is the user's build reference (uses `@ohmyqt/oven`: bun build → rollup dts). It must keep working as-is; fix it ONLY if it demonstrably fails or produces broken output.
- Starting state: `package.json` has `main: dist/index.js`, `types: dist/index.d.ts`, `files: ["dist"]`, `type: module`, `version 0.0.36`; NO `exports` field. `.npmignore` whitelists `LICENSE` but no LICENSE file exists in the repo.
- Verify `dist/index.d.ts` matches the public API exported from `src/index.ts` (type `CSSF`, `__`, `ps`, `f`, `v`, `supports`, `med`/`media`/`Medyas`, `Var`/`Vars`, `Value`, `Shweet`, `fileName`, `X`/`XX`/`XY`/`Z`, plus type exports from `./type` and `core/options` diagnostics).

## Allowed files to modify

- `package.json`, `.npmignore`, `LICENSE`, `README.md`, `builder.ts` (only if broken), and generated `dist/`/`types/` via running the build. Do NOT touch anything under `src/` or `test/` (another worker owns them).

## Requirements

1. Run `bun builder.ts`. Confirm it exits 0 and `dist/index.js` + `dist/index.d.ts` are regenerated and non-empty.
2. Inspect `dist/index.js`: ESM format, correct external handling (bun `external` per Ov config is intentional — verify consumers importing it in plain Node don't break; if the bundle references bun-only APIs, flag it in the report and report exactly where, do not attempt a large fix).
3. Smoke-test consumption: write a throwaway script OUTSIDE the project (e.g. `/private/var/folders/rw/1dv3hk5s6j56vmdj3rjjw7br0000gn/T/opencode/shweet-smoke/`) that imports the built `dist/index.js` and exercises the main entry (create a `Shweet` instance, declare a class, compile/save to the temp dir). It must run with node if possible, otherwise bun — document which.
4. `package.json`: add a proper `exports` map with `types` + `import` conditions pointing at dist files (also keep `main`/`types` for older resolvers). Add relevant `keywords` (css-in-ts, typescript, css, compiler, etc. — concise). Do not rename the package, bump the version, or change license/author/repo fields.
5. Create `LICENSE` with the standard MIT text (year 2026, "MARKjotep").
6. Run `npm pack --dry-run` and verify the tarball file list: `dist/`, `package.json`, `README.md`, `LICENSE`, and no stray files (no `.DS_Store`, no `types/`, no `src/`, no `test/`).
7. Fix anything in `.npmignore` that conflicts with the `files` field.

## Constraints

- Preserve unrelated fields and user edits in package.json (scripts, devDependencies with `link:` specifiers, peerDependencies `typescript ^5.8.2` — leave peerDependencies unless runtime imports of typescript from dist can be demonstrated; if so flag it).
- Never run `npm publish`; dry-run only. Never commit or push.

## Acceptance criteria and validation

- `bun builder.ts` exits 0 with fresh dist output.
- `npm pack --dry-run` shows the expected file list and exits 0.
- The external smoke test imports the built package and runs without error.
- Report: changed files, build/pack/smoke results, any dist or bundling concerns found, unresolved issues.
