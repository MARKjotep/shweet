# Worker 2 — Report: local linked-helper availability

## Status

🟢 Complete. `README.md` now states that the linked helpers exist locally at the sibling paths and separately explains why a clean hosted runner cannot provision the public helper source. Validation passed.

## Files changed

- `README.md` — replaced the "Limitation for future CI" paragraph with two paragraphs distinguishing local availability from clean-checkout provisioning.
- `.ai/REPORT-2.md` — this report.

No other files were modified. `package.json`, lockfiles, source, tests, plan files, and workflows were untouched. The sibling helper repository `../@ohmyqt` was read-only; no writes occurred there.

## README changes

Location: `README.md`, lines 80–99 ("Supported toolchain matrix" section).

1. **Local linked helpers** — records that `package.json` uses `link:@ohmyqt/oven` and `link:@ohmyqt/u`, that both helpers are available in this workspace at `../@ohmyqt/oven` and `../@ohmyqt/u`, and that the installed `node_modules` entries are symlinks resolving there. It states their `src/` and `dist/` exist locally and that the project install/test suite resolve without missing helpers.
2. **Clean checkouts and future CI limitation** — explains that `u/src` (and `u/types`) are untracked in the local helper checkout and the public `master` branch has no committed `u/src` or `u/dist`; only `u/builder.ts`, package metadata, lockfiles, and TypeScript config are tracked. It therefore explains that a clean hosted runner cannot receive those sources, that such a workflow would fail during helper provisioning, and that no workflow is committed for that reason.
3. Preserved the bounded Bun/Node/TypeScript matrix wording and the statement that no hosted CI result is claimed.

## Filesystem and Git evidence

Commands were run from `/Users/Marky/Desktop/$/shweet`.

| Check | Command | Observed |
| --- | --- | --- |
| u symlink target | `readlink node_modules/@ohmyqt/u` | `../../../@ohmyqt/u` |
| u resolved path | `realpath node_modules/@ohmyqt/u` | `/Users/Marky/Desktop/$/@ohmyqt/u` |
| oven symlink target | `readlink node_modules/@ohmyqt/oven` | `../../../@ohmyqt/oven` |
| oven resolved path | `realpath node_modules/@ohmyqt/oven` | `/Users/Marky/Desktop/$/@ohmyqt/oven` |
| local u dirs | `ls -ld ../@ohmyqt/u/src ../@ohmyqt/u/dist` | both exist (`src` and `dist` directories) |
| local oven dirs | `ls -ld ../@ohmyqt/oven/src ../@ohmyqt/oven/dist` | both exist |
| helper checkout status | `git -C ../@ohmyqt status --porcelain=v1` | `u/src/` and `u/types/` untracked; preexisting modified files under `u/` and `oven/` preserved |
| tracked u files | `git -C ../@ohmyqt ls-files u/src u/dist` | no output (neither path tracked) |
| public `origin/master` tree | `git -C ../@ohmyqt ls-tree -r --name-only origin/master \| rg '^u/(src\|dist)/'` | no matches |
| helper revisions | `git -C ../@ohmyqt rev-parse HEAD origin/master` | both `619f076f7806897379fe98e9f3ae3b153ca14adb` |

The sibling package is present and usable locally. The limitation is specifically that its source is untracked locally and uncommitted on public `master`; the report does not claim the local package is missing.

## Validation

### `bun test`

```text
bun test v1.4.4 (38afee6c8)

 144 pass
 0 fail
 667 expect() calls
Ran 144 tests across 14 files. [148.00ms]
```

Exit status: 0.

### `bunx tsc --noEmit --incremental false`

```text
(no output)
```

Exit status: 0.

### README contradiction search

Searched `README.md` for `not available`, `unavailable`, `missing`, `must exist as siblings`, `not currently available`, and helper-missing phrasing:

```text
75: (missing the `s`). On a clean checkout with no ambient `node_modules` in an
86: locally without missing helpers.
965: `node_module/@types` (missing the `s`). On a clean checkout with no ambient
```

Only the unrelated `typeRoots` typo reference and the positive "without missing helpers" sentence matched. No contradictory claim that the helper is unavailable locally remains.

## Acceptance criteria

- 🟢 README says the linked helpers are available in this local workspace at the sibling paths, with symlink targets.
- 🟢 README still explains why clean hosted CI cannot provision the public source and why no workflow is committed.
- 🟢 Report records filesystem/symlink and Git evidence and confirms no sibling writes occurred.
- 🟢 `bun test` and `bunx tsc --noEmit --incremental false` pass.
- 🟢 No workflow restored, no package/lockfile changes, no commits or pushes.
