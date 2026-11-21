# Worker 1 Report — Inline `@ohmyqt/u` types in compiled declarations

## Result
🟢 The requested declaration fix is implemented. `dist/index.d.ts` now declares `Mapped` locally and contains no `@ohmyqt/u` import.

## Why the import appeared
`node_modules/@ohmyqt/u` is a symlink to `../@ohmyqt/u`. That package's `package.json` points `types` to `dist/index.d.ts`, where it exports `Mapped`. Shweet's public declarations reference `Mapped` in types such as `support.value` and `CMapper`, so Rollup's declaration plugin encountered it. The `@ohmyqt/oven` `Roll` wrapper uses `dts()` with its default `includeExternal: []`, which leaves that dependency as an external import.

Other utility imports are implementation-only; they do not appear in declaration signatures. `Mapped` was the utility symbol present in Shweet's public declarations.

## Changes
- `builder.ts` resolves `rollup-plugin-dts` through the linked `@ohmyqt/oven` package and replaces `Roll`'s default dts plugin with `dts({ includeExternal: ["@ohmyqt/u"] })`.
- `Oven.external` remains at its pre-task value: `["bun", "reflect-metadata"]`.
- Rebuilt `dist/index.d.ts`; it contains a local `declare class Mapped` and no external or relative imports. The builder also regenerated `dist/index.js` and intermediate `types/**` output.
- No direct project dependency or sibling-package change.

## Validation
- 🟢 `bun builder.ts` completed and generated the declaration bundle.
- 🟢 `bunx tsc --noEmit --incremental false` passed.
- 🟢 `git diff --check` passed.
- 🟢 Declaration search found `Mapped` locally and no `@ohmyqt/u` import.
- 🟡 `bun test/package-smoke.ts` was attempted while checking the bundle. It stopped at the existing root-export assertion because it still expects `log`, which the current Shweet source intentionally no longer exports. It was not rerun after restoring `Oven.external` to its pre-task value.

No commit or publish was performed.
