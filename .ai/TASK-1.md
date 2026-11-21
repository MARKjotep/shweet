# Worker 1 — Inline @ohmyqt/u types in compiled declarations

## Objective
Fix the declaration bundling step so `dist/index.d.ts` contains the needed `Mapped` declaration locally instead of importing it from `@ohmyqt/u`.

## Relevant files
- `builder.ts`
- `dist/index.d.ts`
- Existing `types/index.d.ts` and `test/package-smoke.ts` (read-only)
- `.ai/REPORT-1.md`

## Allowed files to modify
- `builder.ts`
- Generated `dist/index.d.ts` (and generated `types/**` only if the original build emits them)
- `.ai/REPORT-1.md`

## Implementation requirements
1. Inspect `@ohmyqt/oven`'s `Roll` implementation and use the `rollup-plugin-dts` plugin with `includeExternal: ["@ohmyqt/u"]` so the external package's declarations are included in the bundle.
2. Resolve `rollup-plugin-dts` through the linked `@ohmyqt/oven` package because it owns that build dependency; do not add a direct project dependency or edit `package.json`.
3. `Roll` appends a default dts plugin in its constructor. Replace its public `plugins` list with the configured dts plugin after construction so only one declaration bundler runs.
4. Keep source runtime imports as imports; do not add utility exports or edit application source, tests, README, tsconfig, or the linked sibling repository.
5. Run the original builder and inspect generated declarations. The build tool may adjust `builder.ts`'s `Oven.external` list automatically; if so, restore the original list from before the build so the intentional builder change remains only the plugin configuration.
6. Preserve all pre-existing unrelated workspace changes. Do not commit or publish.
7. Record changes and validation in `.ai/REPORT-1.md`.

## Dependencies
Single-worker task; declaration builder and emitted file must be validated together.

## Constraints and edge cases
- Avoid duplicate dts plugins.
- Do not assume `rollup-plugin-dts` resolves from the project root; resolve it from `@ohmyqt/oven`.
- The package smoke test checks that packed declarations contain no `@ohmyqt/u` import.

## Acceptance criteria
- `builder.ts` uses the configured declaration plugin to inline `@ohmyqt/u` types.
- `dist/index.d.ts` has a local `Mapped` declaration and no `from "@ohmyqt/u"` import.
- `builder.ts` has no incidental `Oven.external` mutation beyond the intentional plugin setup.
- `bunx tsc --noEmit --incremental false` and `bun test/package-smoke.ts` pass.

## Validation commands
- `bun builder.ts`
- `rg -n '@ohmyqt/u|class Mapped' dist/index.d.ts`
- `bunx tsc --noEmit --incremental false`
- `bun test/package-smoke.ts`
- `git diff --check`
