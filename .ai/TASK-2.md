# Worker 2 — Clarify local linked-helper availability

## Objective

Update the runtime-matrix documentation/report to incorporate the user's clarification that `@ohmyqt/u` is their local linked package at `../@ohmyqt/u`. Preserve the distinct fact that its current source is not present in the public helper repository for clean hosted runners.

## Relevant files

- `README.md` — local matrix/CI limitation.
- `package.json` (read only) — `link:@ohmyqt/u` dependency.
- The sibling `../@ohmyqt/u` package is read-only and must not be modified.
- `.ai/REPORT-2.md` — previous report was cleared as stale; write the updated report.

## Allowed files to modify

- `README.md`.
- `.ai/REPORT-2.md`.

Do not edit plan, source, tests, package manifests, workflows, or the sibling helper repository.

## Implementation requirements

1. State the local path accurately: from Shweet, `../@ohmyqt/u`; the installed `node_modules/@ohmyqt/u` symlink resolves there. `../@ohmyqt/oven` is the other linked sibling.
2. Explicitly distinguish this working local sibling package from a clean hosted runner: its `src/` and `dist/` exist in this workspace, but `u/src` is untracked in the helper Git checkout and the public `master` clone has no committed `u/src`/`u/dist`. Do not say the local package is missing.
3. Keep the bounded Node/Bun/TypeScript matrix evidence and hosted-CI limitation truthful. Do not restore the unusable workflow.
4. Write `.ai/REPORT-2.md` with exact inspected paths and validation, and state the sibling was read-only.

## Constraints

- Preserve all preexisting edits in `../@ohmyqt`; do not write there.
- No package or lockfile changes.
- No commits/pushes.

## Acceptance criteria

- README says the linked helpers are available in this local workspace at sibling paths.
- README still explains why clean hosted CI cannot provision the public source and why no workflow is committed.
- Report records filesystem/symlink evidence and says no sibling writes occurred.

## Validation commands

- `bun test`
- `bunx tsc --noEmit --incremental false`
- Confirm README paths/claims with `readlink node_modules/@ohmyqt/u`, `realpath node_modules/@ohmyqt/u`, and `ls -ld ../@ohmyqt/u/src ../@ohmyqt/u/dist` (read-only).
- Search README for contradictory claims that the helper is unavailable locally.
