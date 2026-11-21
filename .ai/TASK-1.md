# Worker 1 — Restore builder.ts original formatting

## Objective
Restore `builder.ts` exactly to its tracked `HEAD` version because the user requested the original code back.

## Relevant files
- `builder.ts`
- `.ai/REPORT-1.md`

## Allowed files to modify
- `builder.ts`
- `.ai/REPORT-1.md`

## Implementation requirements
- Use `git show HEAD:builder.ts` as the source of truth.
- Make no other code changes and do not regenerate build outputs.
- Record the result and validation in `.ai/REPORT-1.md`.

## Dependencies
None.

## Constraints and edge cases
- Preserve all other existing workspace changes, including generated files and type declarations.
- Do not commit or publish.

## Acceptance criteria
- `builder.ts` byte-for-byte matches `git show HEAD:builder.ts`.
- No unrelated files are changed by the restore.

## Validation commands
- Compare `builder.ts` with `git show HEAD:builder.ts`.
- Check `git diff -- builder.ts` is empty.
