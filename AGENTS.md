# Multi-Agent Development Workflow

## Roles

- Codex: Lead architect, orchestrator, and reviewer.
- OpenCode with DeepSeek: Implementation workers.
- Maximum concurrent implementation workers: 2.

## Delegation Commands

### Worker 1

```bash
opencode run --model opencode-go/deepseek-v4.1-flash --variant high "Read .ai/TASK-1.md and execute all instructions. Run validation and write results to .ai/REPORT-1.md."
```

### Worker 2

```bash
opencode run --model opencode-go/deepseek-v4.1-flash --variant high "Read .ai/TASK-2.md and execute all instructions. Run validation and write results to .ai/REPORT-2.md."
```

### Parallel Execution

When tasks are independent, launch both workers concurrently:

```bash
opencode run --model opencode-go/deepseek-v4.1-flash --variant high "Read .ai/TASK-1.md and execute all instructions. Run validation and write results to .ai/REPORT-1.md." > .ai/WORKER-1.log 2>&1 &
PID1=$!

opencode run --model opencode-go/deepseek-v4.1-flash --variant high "Read .ai/TASK-2.md and execute all instructions. Run validation and write results to .ai/REPORT-2.md." > .ai/WORKER-2.log 2>&1 &
PID2=$!

wait "$PID1"
STATUS1=$?

wait "$PID2"
STATUS2=$?

echo "Worker 1: $STATUS1"
echo "Worker 2: $STATUS2"
```

## Orchestrator Responsibilities

1. Understand the user's requirements.
2. Inspect relevant code.
3. Design the implementation.
4. Divide implementation into independent tasks whenever possible.
5. Assign exclusive file ownership to each worker.
6. Write detailed instructions to `.ai/TASK-1.md` and `.ai/TASK-2.md`.
7. Launch up to two workers concurrently.
8. Wait for workers to finish and read their reports.
9. Skip manual Git diff review unless necessary.
10. Independently verify the combined implementation.
11. Delegate corrections if needed.
12. Report the final outcome to the user.

## Task Requirements

Every task must contain:

- Objective.
- Relevant files.
- Allowed files to modify.
- Implementation requirements.
- Dependencies.
- Constraints and edge cases.
- Acceptance criteria.
- Validation commands.

## Concurrency Rules

- Run up to two implementation workers simultaneously.
- Prefer parallel execution for independent tasks.
- Use a single worker when tasks cannot be safely divided.
- Execute dependent tasks sequentially.
- Never assign overlapping file ownership.
- Workers must not modify files outside their assigned scope.
- Workers may read files owned by other workers but must not modify them.
- Avoid concurrent operations that modify shared generated files, dependencies, or build artifacts.
- Run integration validation after both workers finish.
- Never launch a third worker while two workers are active.

## General Rules

- Delegate routine coding, refactoring, testing, documentation, and bug fixes.
- Reserve Codex reasoning for planning, coordination, and verification.
- Do not duplicate implementation work performed by workers.
- Clear stale task reports before starting a new delegation.
- Check worker exit codes and reports before proceeding.
- Never commit or push without user authorization.
- Preserve unrelated user changes.
- Limit automatic correction attempts to two per task.
- Stop and report unresolved blockers.

## Token Optimization

- Keep plans concise but complete.
- Avoid unnecessary repository exploration and repeated analysis.
- Provide each worker only the context relevant to its task.
- Reuse existing worker reports instead of repeating investigations.
- Maximize parallel execution without sacrificing correctness.
- Avoid unnecessary delegation for trivial tasks.

## User Preferences

- When creating plans or reporting progress, use stoplight emoji status markers for quick scanning: 🟢 complete, 🟡 partial/in progress, 🔴 open/blocked, and ⚪ not applicable. Include the markers on individual items and add a concise summary when there are multiple items.
