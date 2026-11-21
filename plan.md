# Shweet modularization and declaration grouping plan

Status: Phases 1, 2, and 3 are implemented. Phase 3 includes the approved imported export-map and shaker/keyframe fixes.

## Objective and baseline

Keep the current Proxy assignment API and sample usage while separating CSS collection, grouping, serialization, and file output into understandable modules. Keep declaration sharing as a core feature.

The helper migration is the completed baseline: source uses `@ohmyqt/u` and local helpers. The user has confirmed that `builder.ts` works and produces the expected output. Use that builder as the build reference throughout this work.

Preserve current user edits in examples, builder/configuration files, package manifests, dependencies, and generated output. Keep source changes in `src/`, tests under `test/`, and examples under `test/example/`. Validation may create temporary artifacts outside the project. Do not commit or push.

## Assessment of declaration sharing

The useful sharing unit is an exact serialized property/value declaration, within the same conditional context. For example:

```ts
c.hello = { color: "red" };
c.world = { color: "red" };
c.hero = { color: "red" };
```

```css
.hello, .world, .hero { color: red; }
```

The current `Loader` already implements this: it indexes serialized declarations by media/support context, collects selectors, and then combines declarations whose selector lists match. Keep that two-stage concept, with clearer types and separate functions.

“One declaration once” should be an optimization target, not an unconditional output guarantee. Different values, conditional contexts, fallback sequences, and conflicting source order can require repeated property names or repeated identical declarations. Do not normalize distinct values such as `0` and `0px` merely to merge them.

A concrete source-order example:

```css
.a { color: red; }
.b { color: blue; }
.c { color: red; }
```

An element with `class="b c"` gets red. Moving both red declarations to the first rule produces `.a, .c { color: red; } .b { color: blue; }` and makes it blue. Keeping every red declaration in one rule cannot preserve all possible overlaps in this example. Specificity still applies independently to each selector in a comma list; grouping does not itself give every selector the highest specificity in the list.

Also measure actual output size. Sharing one short declaration across many long selectors can save little, and splitting larger declaration blocks can repeat selectors. Compare raw and gzip bytes before claiming a size improvement; do not assume a browser runtime improvement.

References: [CSS cascade ordering](https://www.w3.org/TR/css-cascade-5/#cascade-sort), [selector lists and invalid selectors](https://www.w3.org/TR/selectors/#grouping).

## Findings from the current source

- `src/index.ts` mixes the public facade, configuration types, selector registry initialization, saving CSS/maps, regex minification, and composition helpers (`X`, `Z`, `XX`, `XY`).
- `src/css/index.ts` mixes traversal, filtering/export map extraction, animation collection, keyframes, grouping, media/support emission, and formatting. Names such as `props`, `cs2`, `suppcs2`, and `KK` hide their roles.
- `src/css/selectors/index.ts` combines the Proxy base and four different selector/at-rule handlers. `Proc` handles value normalization, selector nesting, string declarations, supports, and animation rewriting.
- Grouping stores selector strings in arrays and splits them with `split(",")`. This needs focused review for commas inside `:is(...)`, `:not(...)`, and attribute values.
- Prefixing replaces every `.` and `#` in a selector string. Quoted attribute values and escaped identifiers need coverage before changing it.
- The loader mutates shared `media.prop` with custom media features. Separate Shweet instances and repeated saves need isolation checks.
- The loader moves animation/transition blocks ahead of other blocks. Preserve this during extraction and characterize its cascade implications before changing it.
- String parsing and minification use splitting/regexes that can affect quoted content, URLs, custom properties, and `calc()`. Treat these as separate correctness work rather than silently rewriting them during file moves.

These observations are review targets, not claims that the user's confirmed examples are failing.

## Proposed module boundaries

Create modules where there is a distinct responsibility; avoid a file for every small helper. Keep existing entry points as re-export facades where needed.

| Location | Responsibility |
| --- | --- |
| `src/index.ts` | Public exports and the `Shweet` entry point |
| `src/core/shweet.ts` | Instance setup and existing public methods |
| `src/core/options.ts` | Named configuration and save types |
| `src/core/registry.ts` | Create/import the Proxy-backed selector handlers |
| `src/core/composition.ts` | Existing `X`, `Z`, `XX`, `XY` behavior |
| `src/output/save.ts` | CSS/map paths and filesystem writes |
| `src/output/export-map.ts` | Export map serialization |
| `src/output/minify.ts` | Existing minification, isolated for focused validation |
| `src/css/index.ts` | Compatibility exports for `Loader` and `toProperty` |
| `src/css/compiler.ts` | Orchestrate compilation, return CSS and class map |
| `src/css/collect.ts` | Traverse selector/import data; collect conditional rules and animation dependencies |
| `src/css/group.ts` | Declaration indexing and selector/declaration grouping |
| `src/css/serialize.ts` | Render blocks, media/support wrappers, keyframes, at-rules |
| `src/css/selectors/base.ts` | Existing Proxy handler contract |
| `src/css/selectors/rules.ts` | Cid, Keyframes, At, FontFace implementations |
| `src/css/selectors/proc/` | Existing processor, with normalization and animation helpers extracted only where cohesive |

Keep property/value, media, variables, supports, and existing helpers in their current folders initially. Keep `src/@misc` entry points for compatibility; descriptive internal names can be introduced without forcing users to rename `ps`, `f`, or `v`.

## Phase 1 — characterize and extract

1. Capture the current source state and representative output before editing. Preserve user changes already present in `test/` and elsewhere. Confirm any previous OpenCode session has finished before starting a worker.
2. Add focused characterization coverage inside `src` for complete compilation output, not just individual property/value formatting. Include grouped declarations, different values, multiple declarations with identical selector lists, imported instances, media/supports, animations/keyframes, export maps, and repeated saves.
3. Extract the module boundaries above in small steps while preserving current CSS bytes, ordering, class maps, and Proxy behavior for the fixtures. Preserve existing exports and deep entry points used by the tests. Do not convert assignments into function calls or generate atomic classes.
4. Replace ambiguous internal names with names such as `declarationsByMedia`, `selectorsByDeclaration`, `rulesBySelectorList`, `animationReferences`, `collectStyleRules`, and `serializeRule`. Use explicit type imports and dependency direction so internal modules do not import the public root barrel.
5. Introduce named internal types for conditional context, declaration groups, and compilation results. Reduce `any` around the extracted boundaries without combining that work with a public type redesign. Do not force keyframes into the same shape as ordinary style rules.

Acceptance: current fixtures produce the same CSS/maps; public imports, options, destructured methods, Proxy reads/writes, bulk assignments, and builder inputs remain compatible. Any discovered behavior discrepancy is recorded for Phase 2 rather than silently accepted as a fixture update.

## Phase 2 — make grouping rules explicit

This phase starts with a review of the characterized behavior. Changes that alter existing output or cascade semantics require a concrete before/after case for approval before implementation.

- Represent grouping keys with exact serialized declarations and ordered media/support context. Keep importance and distinct fallback values intact. Do not globally merge across conditional blocks or keyframe steps.
- Retain source order/provenance before destructive grouping. Review both `Proc` and the loader: recording order only after normalization may be too late if earlier declarations were overwritten.
- Recommend conservative grouping: merge adjacent compatible rules first; broaden merging only when movement across intervening declarations is proven safe. Treat unknown selector overlap, shorthand/longhand interactions, `all`, custom properties, and importance as reasons to retain order. Do not attempt a complete CSS equivalence solver.
- Use `Set<string>` to deduplicate exact selectors within an eligible group while preserving first-seen order. Keep a selector expression intact; split top-level lists only with syntax-aware handling if necessary.
- Preserve selector specificity. Do not replace comma lists with `:is()` or `:where()` as an incidental optimization. Avoid combining vendor/unsupported selector forms with ordinary selectors without a compatibility policy, because an invalid selector can invalidate the list.
- Resolve per-compilation media definitions without mutating the global defaults, respecting intentional user configuration of those defaults. Check that value processing and animation prefixing do not mutate reused input data or double-prefix on repeated compilation.
- Keep current grouping as the Phase 1 compatibility baseline. If conservative grouping changes supported output, present whether to make it the default or expose a compatibility option at the Phase 2 review; do not introduce a public switch during extraction.

Acceptance: demonstrate computed-style equivalence for proposed safe merges and the overlapping-class counterexample; duplicate declaration elimination happens only within eligible groups. Deterministic output and instance isolation are covered.

## Phase 3 — review refactor and demonstrate imported Shweet composition

1. Review the Phase 1 and Phase 2 implementation for duplicated logic, unclear module boundaries, unsafe casts, and compatibility risks. Make only cohesive refactors that improve readability or type safety without changing the approved conservative grouping semantics or public API.
2. Add a more complete example in `test/example/` with two separate Shweet source modules: one exports a configured base Shweet containing shared classes, media rules, and keyframes; another imports that Shweet through `shweets`, adds its own declarations, and saves/inspects the merged CSS and export map.
3. Demonstrate prefix and media-feature behavior across imported instances. Make output order, imported paths, keyframe behavior, and exported class mappings observable in the example or focused tests.
4. Do not merge selector declarations across imported/source boundaries unless the existing import semantics and Phase 2 adjacency rules make them eligible. Preserve imported instance order.
5. Keep the example runnable without overwriting checked-in fixtures. Use a temporary output directory and clean it up. Do not modify `builder.ts`, configuration, dependencies, package manifests, or generated project output.
6. Use the active compilation's `exportMap` setting consistently through the complete imported Shweet tree. In shaker mode, include animation references from imported selectors when deciding which imported keyframes to retain.

Acceptance: the reviewed code remains compatible with the public Proxy API and deep imports; the complex example runs and shows the merged imported/local stylesheet and export map; mixed `exportMap` flags follow the active compilation setting; shaker retains keyframes referenced by imported selectors; tests and typecheck pass; no unrelated fixture or generated file changes.

## Deferred work

The grouping work is settled. The following bounded correctness work can proceed without adding a dependency or changing the public API:

1. **Declaration strings and animation values:** parse declaration boundaries without splitting semicolons/colons inside quoted strings or nested functions; preserve custom property values and normalize only complete numeric values. Handle comma-separated animation names without changing unrelated shorthand tokens, and keep reused inputs immutable.
2. **Selector prefixes:** prefix class/id selectors as selector tokens, preserving escaped identifiers and punctuation inside quoted attribute values, comments, and functional pseudo arguments.
3. **Minification:** preserve quoted strings, comments that are semantically significant, custom property token content, and required whitespace/operators in functions such as `calc()`. Keep the current API and ensure output remains valid for the supported syntax.

These are syntax-aware improvements for the existing supported input, not a complete CSS parser. Record unsupported syntax and avoid guessing where token boundaries are ambiguous. A dependency or full CSS parser choice needs a separate proposal because dependencies/configuration are outside this scope. Do not add modern at-rule support, change public names, remove legacy public helpers, or rewrite the working builder as part of this refactor.

## Production-readiness backlog

Prioritize the next improvements by user impact and release risk; keep these as follow-up work unless they are part of the focused deferred fixes above.

Status legend: 🟢 **Complete** — implemented and covered by existing documentation or tests, or a decision-only item whose deliverable was the recorded decision. 🟡 **Partial** — some behavior or coverage exists, but the named gap remains. 🔴 **Open** — no implementation or test evidence found. ⚪ **Not applicable** — the corresponding mechanism does not exist yet. Reviewed 2026-11-21 against the repository. This status is not a production-readiness claim.

Progress summary: P0 — 4 complete, 1 partial, 0 open. P1 — 3 complete, 0 partial, 0 open, 1 not applicable. P2 — 2 complete (decision-only), 0 partial, 0 open, 0 not applicable. Of 11 items, 9 are complete, 1 partial, 0 open, and 1 not applicable. Seven completions reflect implemented and verified behavior; two are recorded decisions with no implementation. The runtime matrix completion is scoped to the bounded local matrix described below, and the one remaining partial item is real-browser computed-style evidence. No item is claimed production-ready.

Evidence lives in the checked-in tests and manual harnesses referenced per item: `bun test` (suite), `bun test/package-smoke.ts` (packed consumer), `bun test/benchmarks.ts` (diagnostics), `bun test/scaling-benchmarks.ts` (scaling diagnostics), and `bun test/browser-cascade.ts` (optional WebDriver). These manual scripts are intentionally not named `*.test.ts` and do not run as part of `bun test`. Design decisions and parser references are in `docs/design-decisions.md`.

### P0 — before a stable production release

- 🟢 **Complete — input grammar reference.** `README.md` documents the assignment API, supported input handling, and its "Known boundaries"; `test/declaration-syntax.test.ts` and `test/selector-output-syntax.test.ts` characterize accepted and protected syntax. Unsupported forms are already enumerated in the README rather than left ambiguous.
- 🟡 **Partial — browser computed styles.** `test/browser-cascade.ts` is an optional W3C WebDriver harness covering overlapping classes, specificity, shorthand/longhand order, `!important`, media/supports conditions, and comma-containing selectors. Its protocol handling passed against a mocked WebDriver endpoint. On 2026-11-21 the user confirmed that Safari remote automation is enabled and requested another run, reporting no pending Safari permission dialog. A fresh `safaridriver --port 4444` served `GET /status` with `{"value":{"message":"","ready":true}}`; `SHWEET_WEBDRIVER_URL=http://localhost:4444 bun test/browser-cascade.ts` compiled 906 CSS bytes, then timed out after 30 seconds on `POST /session`. A separate direct W3C new-session request using `browserName: "safari"` and `platformName: "macOS"` returned HTTP 500: `The session timed out while connecting to a Safari instance. The following asynchronous operation timed out: Request creation of a new automation session`. An earlier attempt that day had produced the same new-session timeout, and `safaridriver --diagnose` recorded that request and timeout without a more specific reason. The WebDriver process was stopped after each attempt. No browser style assertions ran and no computed-style values were read, so neither attempt is a passing assertion. Gap: Safari must successfully create a WebDriver session for the current machine before this harness can measure styles.
- 🟢 **Complete — import graph diagnostics.** `test/import-graph.test.ts` covers identity deduplication, the same path on distinct instances, defensive cycle traversal, depth-first ordering, and shaker/keyframe retention; import composition behavior is also covered in `test/compiler.test.ts`, `test/grouping.test.ts`, and `test/advanced-example.test.ts`. `test/diagnostics.test.ts` verifies cycle warnings carrying both instance source paths, deterministic termination, duplicate/same-path non-cycles, callback precedence, and malformed callbacks. Boundary: two distinct instances that share a source path are valid, and each compiles with its own prefix/unit options; the current API has no conflicting-option condition, so no option-conflict diagnostic is defined or owed.
- 🟢 **Complete — package smoke.** `test/package-smoke.ts` builds in an isolated copy, runs `npm pack`, verifies packed Node ESM root/deep imports, rejects relative or `@ohmyqt/u` imports in the packed declarations, and typechecks a consumer with no helper package installed under `skipLibCheck: false`. Verified locally on 2026-11-21 (`PASS`; project artifacts unchanged). Hosted execution is unavailable and is described as an automation limitation under runtime matrix.
- 🟢 **Complete — runtime matrix (bounded local matrix).** `README.md` documents a bounded local matrix (Bun 1.4.4; Node 24.22.3 and 26.13.1; TypeScript 5.8.2 and 5.9.3) with reproducible commands. All four Node/TypeScript combinations passed the local project typecheck and the packed-package smoke test, and Bun 1.4.4 passed the full suite. Scope: this is local evidence from a developer machine; no hosted or cross-platform result is claimed, and no version or OS outside that table is implied to be supported. The repository ships no always-on workflow because `package.json` uses `link:` helpers and the public helper repository lacks the `@ohmyqt/u` sources a clean checkout needs. Publishing those helper sources is a separate automation prerequisite, not part of this item.

### P1 — operational confidence

- 🟢 **Complete — structured diagnostics.** `src/core/options.ts` defines `CompileDiagnostic` with a stable `code`, `severity`, `message`, `sourcePath`, and optional `rule`/`selector`, plus an `onDiagnostic` sink; `src/css/collect.ts` emits `keyframes.supports-unsupported` and `import.cycle`. `test/diagnostics.test.ts` covers callback precedence, default console fallback, callback isolation, source-path attribution through imports, and callback failure isolation. Boundary: line/column spans and result-level diagnostic collection are outside the current assignment-Proxy model, which records no source spans; both are explicitly deferred in `docs/design-decisions.md` alongside source maps, and two emit sites are modeled. This is a recorded scope boundary, not an unmet part of the item.
- 🟢 **Complete — benchmarks.** `test/benchmarks.ts` is a manually invoked deterministic report of raw/gzip output size, compile timing, and memory for representative inputs. It deliberately has no thresholds and makes no pass/fail claims.
- 🟢 **Complete — large graph/performance diagnostics.** `test/large-graph.test.ts` compiles a bounded four-layer, forty-class-per-layer import graph and asserts determinism and instance isolation. `test/scaling-benchmarks.ts` adds a manually invoked 128–1024-selector sweep with repeated runs, median timing, raw/gzip bytes, and heap/RSS deltas. Limitation: the sweep has no thresholds, CI gating, or asymptotic claim; timings and memory are machine/GC dependent.
- ⚪ **Not applicable — file cache.** No file-based cache exists in `src/output/` or the build. Revisit this item if caching is introduced.

### P2 — separate design decisions

- 🟢 **Complete — parser evaluation (decision only).** `docs/design-decisions.md` compares maintained PostCSS, css-tree, Lightning CSS, and CSS Tools tokenizer/parser options against source spans, error recovery, supported syntax, dependency/runtime impact, and API fit. Decision: retain the bounded scanners and add no dependency. No parser is integrated.
- 🟢 **Complete — architectural decisions (decision only; all deferred).** `docs/design-decisions.md` records source maps, incremental compilation, modern block at-rules, and a plugin/extension API as deferred, with current provenance, constraints, and explicit reconsideration triggers. None is implemented: source maps and incremental compilation do not exist, block at-rules beyond keyframes/supports/font-face remain unmodeled, and no public plugin lifecycle exists.

Do not treat the backlog as authorization to widen the API or add dependencies. Turn each item into a scoped plan with compatibility evidence before implementation.

## Validation commands and evidence

After approval:

- Run `bun test src` and `bunx tsc --noEmit --incremental false` using the installed tools; add focused regression tests only for the refactor and specified behavior.
- Treat `bun builder.ts` as the build validation command. Run it in a temporary project copy with dependencies linked/resolved correctly so generated bundles and declarations do not overwrite the user's confirmed artifacts. Verify bundled root exports and declaration generation, not just compiler success.
- Reproduce current `test/a`, `test/b`, and `test/c` patterns with temporary output paths; compare CSS and map artifacts without editing or running fixtures that overwrite project files.
- Compare before/after raw and gzip sizes on representative inputs. Record build time as diagnostic evidence; do not set an arbitrary performance target or claim improvement from one timing run.
- For Phase 2, use browser computed styles for overlapping classes, specificity, shorthand/longhand order, importance, media/support conditions, and unsupported selector separation. A string snapshot alone cannot establish cascade equivalence.
- Cover commas/quotes in selectors, quoted values and URLs, fallback ordering where the API supports it, and repeated saves of separate instances. Clearly record unsupported input forms rather than broadening the public API incidentally.
- Review the source changes against the captured baseline and confirm file scope. No tests/build are needed for this plan-only update.

## Delegation workflow

After approval, Codex plans and reviews; OpenCode with DeepSeek implements. Follow the current `AGENTS.md` roles and validation requirements. Keep implementation instructions and worker reports in terminal output to respect the source-only scope, preserving unrelated existing `.ai` content. Use this installation's supported `--model opencode-go/deepseek-v4.1-flash#high` spelling for the documented high variant. One worker may modify files at a time; wait for its completion and independently verify the result. Limit automatic correction attempts to two and report unresolved blockers.
