# Design decisions

Decision date: 2026-11-21. Scope: the P2 design-review backlog in `plan.md`.
These are scoped decisions, not claims that a capability is implemented.

| Topic | Decision | Implementation status | Revisit trigger |
| --- | --- | --- | --- |
| CSS parser/tokenizer | Keep the bounded scanners; add no parser dependency | 🟢 Decided, no code change | Raw CSS input, source spans/maps, or recurring scanner ambiguity |
| Source maps | Defer | 🔴 Not implemented | Consumer devtools mapping or CSS-text input |
| Incremental compilation | Defer | 🔴 Not implemented | A measured compile bottleneck or watch-mode workflow |
| Modern block at-rules | Defer the structured model | 🔴 Not implemented | `@layer`, `@container`, `@scope`, `@property`, or `@starting-style` blocks are required |
| Plugin/extension API | Defer | 🔴 Not implemented | Two or more concrete transforms cannot be expressed by the current API |

## 1. CSS parser and tokenizer evaluation

### Requirements in the current source

Shweet's authoritative input is the TypeScript Proxy assignment API, not a CSS
file. CSS text appears only in bounded places:

- selector prefixing scans `.`/`#` tokens outside quotes, comments, escapes, and
  attribute brackets (`src/css/collect.ts`, `applyPrefix`);
- legacy declaration strings split on top-level `;` and `:` outside quotes,
  escapes, and nested brackets (`src/css/selectors/proc/normalize.ts`,
  `splitTopLevel`/`findTopLevel`);
- animation shorthands split on top-level commas/whitespace and deliberately
  leave ambiguous values unchanged (`prefixAnimationValue`);
- minification preserves strings, `url(...)`, custom-property token content, and
  math-function operators (`src/output/minify.ts`);
- grouping operates on exact serialized declaration strings and never parses
  selectors, specificity, or cascade overlap (`src/css/group.ts`);
- diagnostics carry an instance source path, not line/column spans
  (`src/core/options.ts`, `CompileDiagnostic`).

A full stylesheet parser would therefore parse either a legacy fragment or
already-generated CSS. It would not model declaration sharing, adjacent-only
grouping, media-bucket ordering, or the TS-to-CSS provenance gap.

### Options compared

Versions below were current on npm on 2026-11-21; dependency and package facts
come from the published package metadata.

| Option | Relevant capabilities | Fit and cost |
| --- | --- | --- |
| [PostCSS](https://github.com/postcss/postcss) 8.5.33 | JS AST, source positions/ranges, original whitespace (`raws`), stringifier, large plugin ecosystem ([API](https://postcss.org/api/)) | Strong for CSS-text transforms and plugins. Requires serializing Shweet's object model first, then parsing/rewriting, which risks output-order and formatting changes. Adds a runtime dependency tree (`nanoid`, `picocolors`, `source-map-js`). |
| [css-tree](https://github.com/csstree/csstree) 3.2.1 | Spec-oriented parser/walker/generator/lexer; `positions: true` records `loc`; tolerant parsing wraps bad content in `Raw` and calls `onParseError`; `generate(..., { sourceMap: true })` ([parsing](https://github.com/csstree/csstree/blob/master/docs/parsing.md), [generation](https://github.com/csstree/csstree/blob/master/docs/generate.md)) | Best all-in-one fit if source spans, source maps, and tolerant CSS-text parsing become requirements. It omits redundant whitespace and most comments in the AST, and adds `mdn-data` and `source-map-js` plus a large package. |
| [Lightning CSS](https://github.com/parcel-bundler/lightningcss) 1.33.0 | Rust parser/transformer/minifier; `sourceMap`, `errorRecovery`, visitors, and `customAtRules` options ([docs](https://lightningcss.dev/)) | Powerful but replaces or duplicates the existing minifier and grouping policy, and applies browser-target transforms that conflict with Shweet's conservative cascade rules. Ships platform-specific optional native packages. |
| [@csstools/css-tokenizer](https://github.com/csstools/postcss-plugins/tree/main/packages/css-tokenizer) 4.0.3 + [@csstools/css-parser-algorithms](https://github.com/csstools/postcss-plugins/tree/main/packages/css-parser-algorithms) 4.0.3 | CSS Syntax Level 3 tokenizer with token start/end positions and forgiving `onParseError`; low-level component-value algorithms | Narrowest useful upgrade if only token boundaries or offsets are needed. Two small packages, but still no stylesheet AST, high-level serializer, or source-map generator. |
| [postcss-safe-parser](https://github.com/postcss/postcss-safe-parser) 7.1.0 | Fault-tolerant input for PostCSS | Only useful with PostCSS; does not add a separate capability. |
| [csso](https://github.com/css/csso) 5.0.5 | Structural CSS minifier built on css-tree | Last published 2022; not a maintained choice for new integration. |

### Decision

Retain the bounded scanners and add no parser or tokenizer dependency. The
current tasks are local token boundaries, and the checked-in tests already
characterize the supported cases and pass-through behavior. A parser would add
runtime and install weight and introduce a new serialization path without
solving the object-model or provenance problems.

### Reconsideration triggers

Revisit this decision when any of the following is true:

1. Shweet accepts raw CSS text or imported CSS files as first-class input.
2. Generated CSS needs source maps or diagnostics with line/column spans.
3. Block at-rules or selector structures must be modeled rather than passed
   through as strings.
4. Real consumer input exposes recurring scanner ambiguity that the bounded
   token tests cannot cover.
5. Minification is replaced by a maintained AST minifier with a compatibility
   suite for the current output.

If triggered, prefer `@csstools/css-tokenizer` plus
`@csstools/css-parser-algorithms` for token positions and low-level parsing;
prefer `css-tree` when a full AST, tolerant recovery, and source-map generation
are needed together. Do not adopt a full parser while exact output ordering and
conservative grouping remain core compatibility constraints.

## 2. Source maps

**Decision: deferred; not implemented.**

Already retained: the instance source path (`Shweet.path`, used as
`CompileDiagnostic.sourcePath`), import order, deterministic selector and
declaration order, and the class export map. These identify a file with a
diagnostic, but not the line/column of the Proxy assignment that produced a
declaration.

A source map needs an origin per generated declaration, not just per file. The
prerequisites are:

- capture assignment call sites (or add a compile-time transform) so each
  declaration records a source location;
- carry that origin through collection, grouping, media/supports wrappers,
  keyframe hoisting, and minification;
- track generated line/column positions in `src/css/serialize.ts`;
- define `save` options and output naming for `.map` files and the
  `sourceMappingURL` comment, including multiple `dir` targets;
- compose maps when minification rewrites the generated CSS.

A CSS parser alone does not provide the missing TS-to-CSS mapping. Revisit when
consumers need devtools mapping for generated rules, or when raw CSS input makes
CSS-to-CSS maps meaningful.

## 3. Incremental compilation

**Decision: deferred; not implemented.** `Loader.load` recompiles the full
import graph on every call.

Current benchmark evidence does not justify complexity. The manual
`test/scaling-benchmarks.ts` script builds deterministic four-layer import
graphs and reports local medians of roughly 0.9 ms at 128 selectors, 2.0 ms at
256, 4.0 ms at 512, and 6.7 ms at 1024 (Bun 1.4.4, macOS arm64, seven measured
runs after two warm-ups). These are diagnostic, single-machine observations
with no thresholds, not a complexity or production-workload claim.

If incremental compilation is reconsidered, invalidation must account for:

- per-handler mutation versions for selectors, declarations, media/supports
  values, keyframes, at-rules, and font faces;
- import-graph version propagation and identity deduplication;
- a cache key covering prefix, unit, media features/defaults, `exportMap`,
  shaker/include lists, and webkit keyframe settings;
- adjacency: inserting or deleting a rule can change which neighbors are
  eligible to group, so group results cannot be patched independently of rule
  order;
- invalidation on assignment deletes or in-place changes to reusable `med`
  values, not only on Proxy `set`.

Revisit when a real workload shows compilation dominating runtime (for example,
repeated saves in watch mode) and the assignment API can expose reliable
mutation notifications. Benchmarks alone, without a mutation-observation
design, are not sufficient.

## 4. Modern block at-rules

**Decision: keep the bounded model; a structured at-rule tree is deferred.**

Current support: simple statement at-rules through the `at` registry, plus
`@font-face`, `@keyframes`/`@-webkit-keyframes`, `@supports` blocks, and media
buckets. Other block at-rules are not modeled. The statement form quotes plain
values unless they contain `(`, so it is not a general at-rule prelude parser.

A structured model becomes necessary when output must contain ordered block
at-rules such as `@layer`, `@container`, `@scope`, `@property`, or
`@starting-style`, especially when rules inside them must still participate in
grouping, shaker, or keyframe collection. That requires a rule-node tree with
context wrappers and explicit ordering; `@layer` also changes cascade
precedence, so it cannot be treated as a cosmetic wrapper. Revisit on the first
concrete request for a block at-rule that cannot be represented by a string
statement or `supports()`.

## 5. Plugin and extension API

**Decision: deferred; no public lifecycle or hook surface exists.**

The internal `compiler`/`collect`/`group`/`serialize` modules are implementation
boundaries, not a compatibility contract. A plugin API needs:

- a stable typed rule/declaration model for plugins to receive and return;
- named lifecycle stages (after collection, before/after grouping, before/after
  serialization) and deterministic ordering between plugins;
- conflict, idempotence, and immutability rules, plus error isolation that
  produces diagnostics instead of corrupting output;
- a versioning/deprecation policy and a decision on whether plugins may alter
  grouping, minification, or file output;
- a parser/AST decision if plugins are expected to transform CSS syntax rather
  than Shweet's object model.

Revisit when at least two concrete consumer needs cannot be met by the current
helpers or a small option, or when a supported extension format is explicitly
requested. Adding hooks before the data model and lifecycle are stable would
lock in the least stable parts of the compiler.

## Evidence

Reviewed files: `src/css/collect.ts`, `src/css/group.ts`,
`src/css/serialize.ts`, `src/css/selectors/proc/normalize.ts`,
`src/output/minify.ts`, `src/core/options.ts`, `src/css/compiler.ts`.
Validation on 2026-11-21: `bun test` (144 pass, 14 files),
`bunx tsc --noEmit --incremental false`, `bun test/package-smoke.ts` (PASS), and
`bun test/scaling-benchmarks.ts` (manual diagnostic).
