# Development Workflow

## Roles and delegation

- Codex leads planning, task design, coordination, integration, and final review.
- In OpenCode sessions, `build` uses GPT-6 Luna high as the lead orchestrator.
- OpenCode `code` with DeepSeek high implements tasks; run at most 3 workers at once.
- Use `advisor` with GLM 5.3 high only for blocked architecture decisions. Other named agents are read-only.
- Pin the worker model even if the OpenCode session selected another model.

## `.ai` organization

- Utilize the folders in `.ai`: keep OpenCode-specific agent instructions in `.ai/agents/`, project plans in `.ai/plans/`, task prompts in `.ai/tasks/`, and reports in `.ai/reports/`.
- Store worker output logs under `.ai/reports/logs/`. Put worker and integration reports, progress updates, and archived reports under `.ai/reports/`; keep `.ai` root free of files.
- Keep `AGENTS.md` and `opencode.jsonc` as regular files at the repository root so they remain available when the project folder is copied. Keep OpenCode-specific guidance in `.ai/agents/`.

```sh
opencode run --agent code --model opencode-go/deepseek-v4.1-flash#high \
  "Read .ai/tasks/TASK-N.md and execute all instructions. Run validation and write results to .ai/reports/REPORT-N.md."
```

Replace `N` with `1`, `2`, or `3`. For independent tasks, launch up to three commands concurrently, capture each output in `.ai/reports/logs/WORKER-N.log`, wait for all exit codes, and read all reports. Use one worker for dependent or overlapping work. Never assign overlapping write scopes or launch a fourth worker.

## Task files and user summaries

Every `.ai/tasks/TASK-N.md` starts with a short `## Summary` in **2–4 plain-language bullets**. The bullets tell the user what kind of work the worker is doing, the main files or area it owns, and its intended result. Before launching workers, Codex relays these bullets in user-facing progress commentary. Each worker repeats its task summary at the top of its report. Keep the summary brief and readable; put implementation detail in the sections below.

Each task file also includes:

- Objective and relevant files.
- Allowed files to modify.
- Implementation requirements and dependencies.
- Constraints and edge cases.
- Acceptance criteria and validation commands.

## Orchestration and safeguards

1. Inspect the request and relevant code; design and divide work into independent scopes when useful.
2. Clear or archive stale task reports before delegating. Give workers only needed context.
3. Wait for every worker; check exit codes and reports. Do not duplicate their implementation work.
4. Independently validate integration. Skip manual Git diff review unless necessary; delegate corrections when useful, with at most two correction attempts per task.
5. Preserve unrelated changes. Never commit or push without user authorization. Stop and report unresolved blockers.
6. Do not delegate trivial work or explore unrelated files.

## Plans and progress

Use 🟢 complete, 🟡 partial/in progress, 🔴 open/blocked, and ⚪ not applicable for plans and progress reports.

Every implementation plan has one top-level `## Implementation Progress` section near its beginning. It is the single source of truth: keep one compact table with phase/item, deliverable, acceptance condition, and status. Update it when work starts, completes, changes, or blocks; mark complete only after acceptance is verified. Keep open work specific and current. Do not repeat progress checklists elsewhere in the plan. Reports may include per-run validation output.

## TypeScript source and API docs

- Keep TypeScript source modular by responsibility. Split long files containing unrelated implementation or large lookup families into focused modules, using a directory and small facade/barrel when useful. Compiled output may be bundled; source should remain navigable.
- Preserve public imports, keys, runtime behavior, and type inference during refactors.
- Add brief, user-oriented JSDoc to public Tally chain access and configuration members so editor completion/hover explains utilities, indexed scales, variants, colors, `MEDIA`, and `configure`. Put docs on emitted public type declarations; use concise mapped-type docs instead of thousands of repetitive declarations where possible.
