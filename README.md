# Shweet CSS

TypeScript-first CSS authoring. Shweet provides a Proxy-based assignment API for
writing styles in TypeScript, then compiles those assignments to a CSS file and,
optionally, a class/id export map.

Shweet is published on npm as `shweet` and is currently at `0.0.x`. The published
package ships compiled `dist/index.js` with declarations at `dist/index.d.ts`.
The declarations are bundled into a single self-contained file, so consumers do
not need Shweet's build-time helper packages.

## Install

```bash
bun add shweet
```

TypeScript `^5.8.2` is a peer dependency. The examples and test suite in this
repository run with Bun.

## Supported toolchain matrix

Shweet's supported range is the TypeScript `^5.8.2` peer dependency plus the
Node and Bun versions in the table below. The matrix is deliberately bounded:
other combinations may work, but they are not validated here.

| Tool | Validated values | What was checked |
| --- | --- | --- |
| Bun | `1.4.4` | Complete `bun test` suite, including the isolated builder used by the packed-package smoke test |
| Node | `24.22.3` and `26.13.1` | Node ESM root/deep imports of the packed archive and the strict consumer typecheck |
| TypeScript | `5.8.2` (peer minimum) and `5.9.3` | Project typecheck and the packed-package consumer typecheck with `skipLibCheck: false` |

The evidence behind this table is local: Bun `1.4.4` ran the full suite, and
Node `24.22.3` and `26.13.1` were each crossed with TypeScript `5.8.2` and
`5.9.3` for the project typecheck and the packed-package smoke test. Those runs
were executed on a developer machine, not in hosted CI. The repository ships no
always-on workflow, so no hosted result is claimed and no combination outside
this table is implied to be supported. A local run can only cover the Node, Bun,
and TypeScript versions installed on that machine.

Reproduce the Bun suite and the project typecheck:

```bash
bun test
bunx tsc --noEmit --incremental false --typeRoots node_modules/@types
```

Reproduce one Node × TypeScript matrix entry by installing that compiler
outside the checkout, then typechecking and running the packed-package smoke
test with the same binary:

```bash
# Example: TypeScript 5.8.2 under the active Node release
compiler_dir="${TMPDIR:-/tmp}/shweet-ts-5.8.2"
npm install --prefix "$compiler_dir" --no-save --no-audit --no-fund \
  --ignore-scripts --save-exact typescript@5.8.2
node "$compiler_dir/node_modules/typescript/lib/tsc.js" --version

node "$compiler_dir/node_modules/typescript/lib/tsc.js" \
  --noEmit --incremental false --typeRoots node_modules/@types

bun test/package-smoke.ts \
  --tsc "$compiler_dir/node_modules/typescript/lib/tsc.js" \
  --typescript-version 5.8.2
```

Repeat with TypeScript `5.9.3` and with the `node` binary for Node `24.22.3`
and `26.13.1` on `PATH`. The smoke test builds and packs the project, installs
the archive into a fresh consumer, checks the packed root and deep ESM imports
under the active Node, and typechecks the consumer against the packed
declarations. The compiler override is described with the package smoke test
commands below.

The checked-in `tsconfig.json` spells `typeRoots` as `node_module/@types`
(missing the `s`). On a clean checkout with no ambient `node_modules` in an
ancestor directory, pass `--typeRoots node_modules/@types` explicitly as shown
above so the installed Node and Bun types are used. `tsconfig.json` itself is
left unchanged.

Local linked helpers: `package.json` declares `@ohmyqt/oven` and `@ohmyqt/u` as
`link:` specifiers. Both helpers are available in this local workspace as
siblings of the Shweet checkout, at `../@ohmyqt/oven` and `../@ohmyqt/u`.
`node_modules/@ohmyqt/u` is a symlink that resolves to `../@ohmyqt/u`, and
`node_modules/@ohmyqt/oven` resolves to `../@ohmyqt/oven`. Their `src/` and
`dist/` directories exist here, so the project install and test suite resolve
locally without missing helpers.

Limitation for clean checkouts and future CI: the helper source is not committed
to the public helper repository in a form a clean runner can provision. In the
local helper Git checkout, `u/src` is untracked (as are `u/types`), and the
public `master` branch has no committed `u/src` or `u/dist`; only `u/builder.ts`,
package metadata, lockfiles, and TypeScript config are tracked. The local
sibling package is present and usable, but a hosted runner that clones the public
repository would not receive those sources, so a workflow would fail during
helper provisioning on every push and pull request. No workflow is committed for
that reason. Automation becomes possible only if the helper sources are published
or otherwise made available to a clean checkout; until then, the matrix above is
the available evidence. This is a stated limitation, not a commitment to publish
the helpers.

## Quick start

```ts
// styles.ts
import { Shweet, med, ps } from "shweet";

const app = new Shweet({
  __filename,
  prefix: "app",
  exportMap: true,
  mediaFeature: {
    standalone: "(display-mode: standalone)",
  },
});

// Keep the instance for saving and media helpers, and destructure the
// assignment handlers once.
const { c, i, d, kf } = app;

// `c.name` creates a class rule; the prefix is applied at compile time.
c.card = {
  display: "grid",
  gap: 1,
  padding: 1,
  fontSize: med(1, { md: 1.25 }),
  color: med("black", { dark: "white", standalone: "navy" }),
};

// Names that are not valid identifiers use bracket notation.
c["card-title"] = { fontWeight: "bold" };

// `i` and `d` write id rules and arbitrary selectors.
i.main = { maxWidth: 60 };
d["body"] = { margin: "0 auto" };

// `kf` writes keyframes; matching animation names are prefixed too.
kf.pulse = {
  from: { opacity: 1 },
  "50%": { opacity: 0.5 },
  to: { opacity: 1 },
};
c.pulse = { animation: "pulse 2s infinite" };

// Arrays combine declarations, nested selectors, and conditional blocks.
c.grid = [
  { display: "grid" },
  ps.child(".cell")({ minHeight: 2 }),
];

app.save({
  dir: "./generated",
  mapDir: "./generated",
  minify: false,
});
```

Run it with Bun:

```bash
bun styles.ts
```

This writes `generated/styles.css` plus `generated/index.js`. The export map is a
JavaScript module of named exports: each key is unprefixed and uses `_` in place
of `-`, while each value carries the prefix (for example `card="app_card"`).

## The assignment API

`new Shweet(options)` returns an instance whose handlers are Proxies. Assigning a
property creates a rule in assignment order:

| Handler | Writes | Example |
| --- | --- | --- |
| `c` | class selectors | `c.card = { color: "red" }` → `.app_card` |
| `i` | id selectors | `i.main = { ... }` → `#app_main` |
| `d` | arbitrary selectors | `d["#app"] = { ... }` |
| `kf` | `@keyframes` | `kf.pulse = { from: { opacity: 1 } }` |
| `at` | simple at-rules | `at.import = "theme.css"` → `@import "theme.css";` |
| `font` | `@font-face` | `font.Inter = { src: "url(inter.woff2)", fontDisplay: "swap" }` |

Values are plain CSS declarations. Bare numbers become `rem` by default; use the
`unit` option to select `rem`, `em`, `px`, `pt`, or `pc`. Known unitless
properties such as `lineHeight`, `fontWeight`, `zIndex`, and `tabSize` keep the
bare number, and time properties receive seconds. Legacy
`"property: value; ..."` strings are also accepted, and arrays or `c.__({...})`
can be used for bulk assignment. Nested keys such as `":hover"` and `" .child"`
create nested selectors; `ps` provides typed helpers for the same forms
(`ps.hover()`, `ps.child(".cell")`, `ps.before()`, and so on). The accepted
declaration, selector, media, import, animation, and custom-property forms are
collected in the [Supported input reference](#supported-input-reference).

### Media conditions with `med`

`med` describes one value across media buckets. The first argument is the
default value; the optional second argument maps named buckets to overrides:

```ts
app.c.panel = {
  display: med("block", { md: "flex" }),
  padding: med(1, { md: 1.5, print: 0 }),
};
```

`xs` is the default bucket and is emitted without a media wrapper. The built-in
named keys are:

| Keys | Condition |
| --- | --- |
| `sm`, `smd`, `md`, `lg`, `xl`, `xxl` | `min-width` breakpoints at 480, 624, 768, 1024, 1280, and 1536 pixels |
| `dark`, `light` | `(prefers-color-scheme: ...)` |
| `no_hover`, `mobile` | `(pointer: coarse)` |
| `print`, `screen` | media types |

The object-only form `med({ md: "flex" })` skips the default value. Custom
features are declared with the instance's `mediaFeature` option, then
referenced by key:

```ts
new Shweet({
  __filename,
  mediaFeature: { standalone: "(display-mode: standalone)" },
});

app.c.shell = {
  minHeight: med("100vh", { standalone: "100dvh" }),
};
```

Media features are resolved by the instance that saves. When styles are
imported through `shweets`, repeat any custom feature keys those imported
styles use on the saving instance.

Reference: [Media and supports](#media-and-supports).

### Reusable presets with `Medyas`

Subclass `Medyas` to package reusable declarations. Getters write through
`_value` and return `this`, so they chain like the built-in accessors. Media
accessors such as `.MD`, `.MOBILE`, or `.DARK` create a new instance that
shares the subclass `data` and the declaration buckets, and scope only the
declarations written after them:

```ts
import { Shweet, Medyas, type MedyasOptions } from "shweet";

const app = new Shweet({ __filename, prefix: "app" });
const { c } = app;

interface SurfaceData {
  tone: "plain" | "dark";
}

class Surface extends Medyas<Surface, SurfaceData> {
  constructor(options: MedyasOptions<SurfaceData> = {}) {
    super({ data: { tone: "plain" }, ...options });
  }

  get card() {
    const dark = this.data.tone === "dark";
    this._value = {
      display: "block",
      padding: 2,
      backgroundColor: dark ? "black" : "white",
      color: dark ? "white" : "black",
    };
    return this;
  }

  get compact() {
    this._value = { padding: 1 };
    return this;
  }

  get outlined() {
    this._value = { border: "1px solid currentColor" };
    return this;
  }
}

// `card` writes xs declarations; `compact` runs after `.MD`, so it only
// overrides `padding` in the md bucket.
c.surface = new Surface().card.MD.compact;

// Constructor data survives media accessor chaining.
c["surface-inverse"] = new Surface({
  data: { tone: "dark" },
}).card.outlined;
```

`MedyasOptions<Q>` has optional `prefix`, `data`, and `values` fields, so
`new Surface()`, `new Surface({ prefix: "md" })`, and fully supplied options
all work. `prefix` names the bucket written by direct `_value` assignments on
that instance: `new Surface({ prefix: "md" }).card` writes md values only.
`values` is the shared bucket record used internally for chaining; omit it
unless you are deliberately sharing buckets between instances.

The `MOBILE` accessor targets the `mobile` bucket, while `NO_HOVER` targets
`no_hover`; both currently compile to `(pointer: coarse)`.

### Variables with `Var` and `Vars`

Custom properties use `Var` for a single token and `Vars` for a named map.
Declare them on `:root` through `d`, then reference them with `.__()`:

```ts
import { Shweet, Var, Vars, med } from "shweet";

const theme = Vars({
  ink: "#1f2933",
  surface: "#ffffff",
  accent: med("#2563eb", { dark: "#60a5fa" }),
});

const { c, d } = new Shweet({ __filename, prefix: "app" });

d[":root"] = theme;

c.card = {
  color: theme.ink.__(),
  backgroundColor: theme.surface.__(),
  borderColor: theme.accent.__(),
};
```

`Vars` maps each key to a token; camelCase keys become kebab-case custom
properties (`fontSize` becomes `--font-size`). `Var` takes a single-entry
object:

```ts
const radius = Var({ radius: "0.75rem" });
d[":root"] = radius;
c.card = { borderRadius: radius.__() };
```

`.__()` accepts a fallback for when the property may be absent:

```ts
color: theme.ink.__("#111827"); // var(--ink, #111827)
```

When a token is defined with `med`, the default value is written in the normal
declaration bucket and each named bucket writes the same custom property inside
its `@media` block. The `accent` token above produces `--accent: #2563eb` on
`:root` plus `:root { --accent: #60a5fa }` inside
`@media (prefers-color-scheme: dark)`.

Reference: [Custom properties](#custom-properties).

### Pseudo selectors with `ps`

`ps` builds nested-selector declaration blocks. Call a helper, then call the
returned function with declarations (or an array of them); the result is placed
in the assignment array:

```ts
c.button = [
  { padding: "0.5rem 1rem" },
  ps.hover()({ backgroundColor: "#e5e7eb" }),
  ps.focusVisible()({ outline: "2px solid currentColor" }),
];

c.card = [
  { padding: 1 },
  ps.child(".card-title")({ margin: 0 }),
  ps.is(".featured")({ borderColor: "gold" }),
  ps.has("> .card-media")({ gridTemplateColumns: "1fr 2fr" }),
  ps.attr({ "data-state": "open" })({ display: "block" }),
];
```

Many pseudo-class and pseudo-element helpers accept an optional selector suffix,
for example `ps.hover(".is-active")`. `ps.attr` currently reads the first entry of one
attribute/value object and renders `[name="value"]`. These helpers cover a
curated set of selectors, not the entire CSS selector grammar; remaining
selectors can still be written as `":..."` keys or arbitrary `d` rules.

Reference: [Selector handling and prefixing](#selector-handling-and-prefixing).

Available helpers are grouped by role:

- **Pseudo-classes**: `active`, `checked`, `disabled`, `enabled`, `empty`,
  `firstChild`, `lastChild`, `onlyChild`, `focus`, `focusVisible`,
  `focusWithin`, `hover`, `visited`, `target`, `fullscreen`, `modal`, and
  related state helpers.
- **Pseudo-elements**: `before`, `after`, `placeholder`, `selection`, `marker`,
  `backdrop`, `firstLine`, `firstLetter`, `part(...)`, `slotted(...)`, `cue`,
  plus the scrollbar helpers `scrollbar`, `scrollbarThumb`, `scrollbarTrack`,
  and `scrollbarCorner`.
- **Selector functions**: `has(...)`, `is(...)`, `where(...)`, `not(...)`,
  `dir(...)`, `lang(...)`, `nthChild(...)`, `nthLastChild(...)`,
  `nthOfType(...)`, `nthLastOfType(...)`, `state(...)`, `host_(...)`,
  `hostContext(...)`, and `webkit(...)`.
- **Combinators and selector lists**: `child(".x")` (`>`), `desc(".x")`
  (descendant), `next(".x")` (`+`), `general(".x")` (`~`), `and(".x")` (adds to
  the selector list), and `withClass(".x")`.

### Supports blocks

```ts
import { med, supports } from "shweet";

app.c.grid = [
  supports({ display: "grid" })({
    display: "grid",
    grid: med(1, { lg: 3 }),
  }),
  supports("selector(:has(*))")({ padding: 1 }),
];
```

`supports` emits a conditional feature query around its declarations. An
object is converted to `property:value` query text (`@supports(display:grid)`),
while a string is used verbatim as the condition
(`@supports(selector(:has(*)))`). Pass one or more declaration objects to the
returned function; `med` values inside them work like other assignment blocks.

Reference: [Media and supports](#media-and-supports).

### Keyframes

```ts
app.kf.pulse = {
  from: { opacity: 1 },
  "50%": { opacity: 0.5 },
  to: { opacity: 1 },
};

app.c.pulse = { animation: "pulse 2s infinite" };
```

Animation names in `animation`/`animationName` are prefixed alongside the
keyframes rule, producing `@keyframes app_pulse` and
`animation: app_pulse 2s infinite`. Set `webkitKeyframes: true` to also emit
`@-webkit-keyframes`.

Reference: [Animation values](#animation-values).

### Prefixing

`prefix: "app"` prefixes class and id tokens (including those inside arbitrary
`d` selectors), keyframe names, and animation name references. Imported
instances keep their own prefix independently.

Reference: [Selector handling and prefixing](#selector-handling-and-prefixing).

### Composing instances

Pass existing instances through `shweets` to merge their declarations, keyframes,
and export-map entries:

```ts
const base = new Shweet({ __filename, prefix: "base" });
base.c.panel = { padding: 1 };

const app = new Shweet({
  __filename,
  prefix: "app",
  shweets: [base],
  // Media features are resolved by the instance that saves, so repeat any
  // feature keys that imported styles use.
  mediaFeature: { standalone: "(display-mode: standalone)" },
});
```

Imported styles are collected after local styles, in import order. The composed
stylesheet keeps each instance's prefix.

Reference: [Imports, at-rules, and font faces](#imports-at-rules-and-font-faces).

## Supported input reference

This section consolidates the input forms the compiler accepts today.
**Guaranteed** describes behavior implemented in the current compiler and covered
by the CSS-string tests; it does not establish browser computed-style
equivalence. Examples illustrate syntax rather than adding guarantees. Anything
not listed here is either passed through unchanged or called out in
[Known boundaries](#known-boundaries).

### Declarations

**Guaranteed**

- Assign a declaration object to a `c`, `i`, `d`, or `kf` rule. Property names
  may be camelCase (`fontSize`) or kebab-case (`font-size`); output uses
  kebab-case. This conversion also applies to custom-property names
  (`--gapSize` → `--gap-size`), including names written in a legacy declaration
  string.
- Assignment and declaration order are preserved inside a rule. Reassigning the
  same property keeps the last value, including across repeated assignments to
  the same rule.
- Arrays are flattened in order, so declaration objects, `ps.*` blocks,
  `supports(...)` blocks, and nested arrays can be combined.
- A legacy string `"property: value; ..."` is split at top-level semicolons and
  the first top-level colon. Duplicate properties keep the last value, and a
  fragment without a top-level colon is dropped. Separators inside quoted
  strings, escapes, `url(...)`, nested functions, and braces are preserved.
- `undefined` declaration values are skipped. Strings are written as-is and are
  not CSS-validated. Arrays of values are joined with spaces, except for
  comma-separated properties such as `transitionProperty`.
- A JavaScript `number` receives the configured `unit` (`rem`, `em`, `px`, `pt`,
  or `pc`; default `rem`) unless the property is a known unitless or time
  property. Common unitless numeric properties include `lineHeight`,
  `fontWeight`, `opacity`, `zIndex`, `tabSize`, `zoom`, `orphans`, `widows`, and
  the numeric `borderImageOutset`, `borderImageSlice`, and `borderImageWidth`
  factors. Time properties take seconds (`transitionDuration: 2` → `2s`).
- A numeric string in an object is not unit-converted. In a legacy declaration
  string, a complete finite numeric literal is converted to a number first, so
  `"width: 10"` becomes `10rem`; hex forms and `Infinity` stay text.
- String `content` values are wrapped in single quotes. Values containing `(`
  are passed through.

```ts
c.card = {
  padding: 1, // 1rem
  lineHeight: 1.5, // 1.5 (unitless)
  fontWeight: 700, // 700 (unitless)
  zIndex: 2, // unitless
  transitionDuration: 2, // 2s
  width: "10", // 10 (not 10rem)
  "--gap": "0", // --gap: 0
};
c.legacy = "color: red; width: 10; --shadow: 0 0 10px rgba(0,0,0,.5)";
```

**Limits**

- An empty string, a boolean, or an unsupported nested object is not converted
  and can serialize as an empty declaration such as `color: ;`. Shweet does not
  report a syntax error for these values.
- `null` is not accepted and throws during assignment.
- There is no complete property/value grammar, shorthand expansion, or value
  validation.
- Unitless handling is based on property names, not value types. The built-in
  set covers common standard unitless numeric properties, including `lineHeight`,
  `fontWeight`, `tabSize`, `zoom`, `orphans`, `widows`, and numeric border-image
  factors. Properties outside the built-in unitless/time sets receive the
  configured unit, so `outlineWidth: 2` becomes `2rem`; use a string
  (`outlineWidth: "2px"`) for the intended CSS value.

### Selector handling and prefixing

**Guaranteed**

- `c.name` writes a class selector, `i.name` writes an id selector, and
  `d[selector]` writes an arbitrary selector. Class and id tokens are prefixed
  at compile time (`app` + `.card` → `.app_card`).
- Nested keys starting with `:`, `[`, `,`, `.`, or `#` are appended to the
  parent selector. Keys starting with whitespace add a descendant or combinator
  suffix (`" > .child"`), and a comma list in the suffix is split at top-level
  commas so each target receives the parent.
- The prefixer walks class and id tokens only. It does not prefix tag names,
  quoted strings, attribute-selector contents, comments, escaped punctuation
  (`\.`, `\#`), or a dot/hash followed by a digit.
- `:is()`, `:not()`, `:has()`, attribute selectors, and escaped identifiers stay
  intact as one expression. Grouping never splits them at inner commas.
- Grouping merges only adjacent rules with an identical serialized declaration
  sequence, preserving first-seen selector order within the group. It does not
  move a rule across an intervening one or across media/supports contexts.

```ts
c.panel = [
  { display: "grid" },
  ps.hover()({ backgroundColor: "gray" }),
  ps.child(".cell")({ minHeight: 2 }),
];
d['[data-state="open"] .menu'] = { display: "block" };
```

**Limits**

- `ps` exposes a curated helper set; other selectors are written as `":..."`,
  `"[...]"`, or `d` rules.
- The prefixer is a bounded scanner, not a selector parser. Syntax it does not
  recognize is copied through and may remain unprefixed.
- Grouping is string-level. It does not evaluate specificity, cascade overlap,
  or invalid-selector list behavior.

### Media and supports

**Guaranteed**

- `med(default, buckets)` writes the default in `xs` and each named bucket in
  its own `@media` block. `xs` has no wrapper, and the object-only form skips
  the default. The built-in bucket names are listed in
  [Media conditions with `med`](#media-conditions-with-med).
- Buckets are emitted in the configured media order. Rules inside a bucket keep
  source order after conservative grouping, except that animation and
  transition groups are hoisted to the front of that bucket.
- Custom feature keys are resolved per compilation. `save` uses the instance's
  `mediaFeature`; direct `Loader.load` callers pass the feature record as its
  second argument. Features are not inherited from imported instances.
- `supports(object)` renders `@supports(property:value)`, while
  `supports("...")` uses the string verbatim. Pass one or more plain declaration
  objects to the returned function; `med` values inside them are supported.
  Supports blocks are emitted inside their media bucket after keyframes.
- `@supports` inside `@keyframes` is not supported; it is logged and skipped.

**Limits**

- A custom feature key containing `-` cannot be used reliably as a media bucket
  name, because bucket names are split on `-` when the media query is rendered.
- A bucket whose custom feature key is not configured for that compilation is
  omitted from the output.
- Media conditions are not evaluated; Shweet only serializes the configured
  strings.

### Imports, at-rules, and font faces

**Guaranteed**

- `at.import = "theme.css"` writes `@import "theme.css";`. A value containing
  `(` (for example `url("theme.css")`) is written without added quotes.
  `at.charset` follows the same quoting rule.
- At-rules are emitted before style rules. Identical at-rule text is emitted
  once; different values for the same at-rule are all kept.
- `font.<family> = { ... }` writes an `@font-face` block with a quoted
  `font-family` and the supplied descriptors in assignment order.
- `shweets: [base]` merges the imported handlers. Local rules are collected
  first, then imported rules in import order and depth-first for nested imports.
  Each instance keeps its own prefix, and export-map collection follows the
  active compilation rather than an imported instance's creation-time flag.
- Repeated imports of the same `Shweet` object are deduplicated by identity and
  keep their first-seen position. Two distinct `Shweet` objects that share a
  source path remain distinct and both compile with their own options.
- Imports passed to the constructor form an acyclic graph because an instance
  must exist before it can be imported. Internal traversal also carries
  identity guards, so cycles created by mutating handler links terminate
  predictably instead of repeating output.
- Shaker filtering considers animation references from imported selectors, so
  an imported keyframe is kept when a retained imported class references it.

**Limits**

- Media features are not inherited from imports; repeat keys on the saving
  instance.
- `imported` reports paths as a set: distinct instances that share a path are
  both compiled but report that path once.
- Import cycles are unsupported as a public construction path. The traversal
  guards in the bullet above only make internally mutated cycles finite.
- Only keyframes, supports, font faces, and simple statement at-rules are
  modeled. Other block at-rules are not.
- Plain at-rule strings are quoted unless they contain `(`; there is no
  at-rule-specific formatting.

### Animation values

**Guaranteed**

- Keyframe names are prefixed (`kf.pulse` → `@keyframes app_pulse`), and
  `animation`/`animationName` values are prefixed when the declaration is
  assigned. Recompiling, or reusing one `med` value across rules, does not
  double-prefix.
- `animation` accepts a comma-separated list. Each item is split on top-level
  whitespace; time values, numbers, timing functions and keywords, direction,
  fill, play-state, `infinite`, `none`, and CSS-wide keywords are skipped.
  Quoted tokens are treated as names. An item with an unknown function
  (`var()`, `env()`, ...), more than one name candidate, or a leading, trailing,
  or double comma is left unchanged.
- `animationName` accepts one name per comma-separated item, optionally with a
  trailing `!important`. Functions and non-name tokens are left unchanged.
- Only `animation` and `animationName` are rewritten. Custom properties and all
  other properties are not.
- Numeric keyframe step keys become percentages (`50` → `50%`).
  `webkitKeyframes: true` also emits `@-webkit-keyframes`.
- With a shaker, a keyframe is kept only when a retained selector references it.

**Limits**

- Value recognition is a bounded token scanner, not a full `animation` grammar.
  Ambiguous values are deliberately left untouched rather than guessed.

### Custom properties

**Guaranteed**

- A `--name` key goes through the normal kebab-case conversion
  (`--gapSize` → `--gap-size`, `--Gap` → `--gap`). Its value uses the normal
  declaration serialization, so a JavaScript number receives the configured unit
  (`"--gap": 0` → `--gap: 0rem`); use a string (`"--gap": "0"`) to keep the
  token text.
- In a legacy declaration string, the declaration parser preserves the `--name`
  token while parsing, but the serializer still applies the same kebab-case
  conversion to the property name. A numeric-looking custom-property value is
  not converted.
- `Var({ name: value })` and `Vars({ ... })` create tokens. `Vars` converts
  camelCase keys to kebab-case custom-property names. `Var` uses the first entry
  only. `.__()` returns `var(--name)` or `var(--name, fallback)`. Token values
  follow the same numeric/unit rules as other declarations.
- A token defined with `med` writes the default on the declaration's selector
  and each bucket's value in its `@media` block.
- Minification preserves custom-property token content verbatim, including
  internal whitespace and quoted separators.

**Limits**

- `Var` ignores entries after the first. Token values are not validated, and
  custom properties are not registered with `@property`.

### Malformed and ambiguous input

The guaranteed recovery behavior for malformed input is intentionally small:

- Legacy declaration strings keep valid fragments around a fragment that has no
  top-level colon. Empty fragments are skipped, and later duplicates win.
- Declaration values are not syntax-checked. `undefined` is skipped, while an
  empty string, a boolean, or an unsupported object can produce an empty
  declaration such as `color: ;`; `null` throws.
- An unbalanced quote, bracket, brace, or comment makes the bounded scanners
  treat the remainder as part of that region; output may copy it through rather
  than recover a useful split.
- Unrecognized selector or at-rule syntax is passed through. Unsupported nested
  objects are not recursively interpreted as CSS.
- Unsupported or ambiguous animation items are left unchanged, and no keyframe
  reference is recorded for them.

These are string-level diagnostics only. They do not assert browser
computed-style equivalence; see [Known boundaries](#known-boundaries).

## Saving

`save` compiles the instance and returns it for chaining:

```ts
app.save({
  dir: "./generated", // string or string[]
  mapDir: "./generated", // string or string[]
  mapName: "index", // export-map file name, default "index"
  name: "app", // CSS file base name, default instance name
  minify: true, // default true
});
```

`dir` writes `<name>.css`. `mapDir` writes the export map as `<mapName>.js`.
Passing `mapDir` enables export-map collection when `exportMap` was not set
explicitly; `exportMap: true` enables it independently. `save({ name })`
overrides the CSS file base name; without it, the instance `name` is used, which
defaults to the source file name derived from `__filename`.

`shaker` limits output to matching class/id names; `include` adds extra names
that must be kept while shaking. Keyframes referenced by retained animation
rules are kept as well.

## Conservative grouping

Shweet performs only conservative rule grouping. Adjacent style rules with an
exactly identical serialized declaration sequence are merged into one selector
list; any rule with different declarations ends the group. Rules are never
merged across media or supports contexts, and a later rule with matching
declarations is not moved past an intervening one. Within each media block,
`animation`/`transition` rules are emitted before other style rules, followed by
keyframes and supports blocks. This preserves source order rather than
maximizing deduplication.

## Helper families

The root entry point also exports value builders and lower-level utilities.

### `f` — CSS function builders

`f` builds CSS function values as strings: `calc`, `clamp`, `min`, `max`,
`minmax`, `repeat`, gradients, transforms, filters, colors, `attr`, `url`, and
`var`. They are value helpers, not a CSS validator; unsupported syntax is passed
through as written.

```ts
import { f } from "shweet";

c.hero = {
  width: f.min("100%", "60rem"),
  padding: f.calc("100%", "-", 2), // calc(100% - 2rem)
  fontSize: f.clamp(1, "4vw", 2), // clamp(1rem, 4vw, 2rem)
  gridTemplateColumns: f.repeat(3, f.minmax(0, "1fr")),
  backgroundImage: f.linearGradient("to right", "#2563eb", "#60a5fa"),
  color: f.rgb(31, 41, 51),
  borderColor: f.var("ink", "#111827"), // var(--ink, #111827)
};
```

Numbers are converted by each helper: length functions generally add `rem`,
angle functions add `deg`, and percentage-oriented helpers such as `polygon`
add `%`. Values that already include units or functions are kept as strings.

### `v` — keyword constants

`v` collects common CSS keyword strings so declarations avoid repeated quoted
literals. `v.important` is `" !important"` for appending to a value.

```ts
import { v } from "shweet";

c.overlay = {
  display: v.none,
  position: v.absolute,
  inset: 0,
  cursor: v.pointer,
};

c.hidden = { display: v.none + v.important };
```

The predefined groups include layout and flex keywords (`flex`, `center`,
`space_between`, `wrap`, `column`, `row`), positioning (`relative`, `absolute`,
`fixed`, `sticky`), display (`block`, `none`), sizes (`pr100`, `pr50`,
`i100vh`, `i100vw`), borders (`solid`, `inset`), cursors, font weight
(`bold`), and shared keywords such as `auto`, `initial`, and `inherit`.

### `X`, `Z`, `XX`, `XY` — legacy composition helpers

These helpers compose declarations in plain CSS maps, not on a `Shweet`
instance. `Z(cx, entries)` writes a main declaration block and related
`${main}_${key}` entries, where a key starting with `$` keeps its name without
the main prefix. `X(cx, entries, prefix?)` writes each entry into the map,
optionally prefixing the key. `XX(record)` and `XY(record)` wrap a nested
record so `X` expands it instead of storing the wrapper as a declaration value;
`XY` inherits the current main key as a prefix, while `XX` writes its keys as
given. They are kept for existing code and are not required for normal
assignment usage.

### Lower-level utilities

Several root exports are lower-level building blocks. Their shapes follow the
current source rather than a separate stable abstraction:

- `media` — the class behind `med`, holding a default value and named media
  buckets.
- `Medyas` — generic base for objects with named buckets and `XS`/`SM`/... /
  `DARK` accessors; `MedyasOptions<Q>` is its public constructor options type.
- `Value` — serializes a value or array to CSS text with unit, quote, and
  delimiter options.
- `Var`, `Vars` — custom-property token helpers; see
  [Variables with `Var` and `Vars`](#variables-with-var-and-vars).
- `fileName` — derives a base file name from a path.
- `__` — miscellaneous utility namespace (random helpers, DOM creation, and
  formatting) from the helper barrel.

Utilities from `@ohmyqt/u` are internal imports where Shweet needs them; Shweet
does not re-export that package's helpers from its root API.

## Examples

- [`test/a/index.ts`](test/a/index.ts) — the shared design kit: `Vars` tokens on
  `:root`, `med` breakpoints, a custom media feature, keyframes, and `ps`
  nesting.
- [`test/b/index.ts`](test/b/index.ts) — a blog fixture composed from `test/a`,
  repeating its media feature and adding `supports` blocks.
- [`test/c/index.ts`](test/c/index.ts) — the final page fixture with a
  three-level composition chain, `ps.has`, and targeted media features.
- [`test/example/index.ts`](test/example/index.ts) — a composed instance with
  imported declarations, custom media features, nested selectors, supports,
  keyframes, and export-map assertions.
- [`test/example/base.ts`](test/example/base.ts) — the imported base instance.

Run the composed example:

```bash
bun test/example/index.ts
```

Run the test suite:

```bash
bun test
```

Run the non-gating input/compile diagnostics:

```bash
bun test/benchmarks.ts
```

The benchmark uses deterministic synthetic inputs and reports raw/gzip bytes,
compile duration, and heap/RSS figures. It has no thresholds or pass/fail
claims, and writes only to a temporary output directory.

Run the manual package smoke test:

```bash
bun test/package-smoke.ts
```

It builds the current source with `builder.ts` in a temporary copy, packs the
archive, installs it into a fresh consumer, and checks the packed root and the
`shweet/dist/index.js` deep import through Node ESM before typechecking a
consumer against the packed declarations with `skipLibCheck: false`. The
consumer installs only the packed archive, so the check also verifies that the
declarations do not need `@ohmyqt/u` or any other helper package. It uses the
locally installed `bun`, `node`, `npm`, and `tar` commands without network
access, writes under the system temporary directory, and removes its workspace
on exit. It is not part of `bun test`.

By default the smoke test uses the project's installed TypeScript when that
version satisfies `^5.8.2`. To use a separately installed compiler without
changing `package.json`, `bun.lock`, or the checkout's `node_modules`:

```bash
bun test/package-smoke.ts \
  --tsc /path/to/typescript/lib/tsc.js \
  --typescript-version 5.9.3
```

Both flags are required together. The script runs the supplied binary with
`--version` and fails unless the reported version exactly matches
`--typescript-version`, so a matrix run checks the compiler it actually
invoked.

Run the optional browser cascade regression harness:

```bash
SHWEET_WEBDRIVER_URL=http://localhost:4444 bun test/browser-cascade.ts
```

The harness drives a real browser over the W3C WebDriver HTTP protocol using
the endpoint in `SHWEET_WEBDRIVER_URL`. Any compatible endpoint works; a local
driver is enough. Start one of these separately if it is already installed, for
example:

```bash
chromedriver --port=4444    # Chrome
geckodriver --port=4444     # Firefox
safaridriver --port 4444    # Safari, after enabling Remote Automation yourself
```

Then point `SHWEET_WEBDRIVER_URL` at that driver (`http://localhost:4444`
above). The harness does not install, start, or configure a driver, and there
is no other environment variable to set.

When the variable is absent, the script prints a skipped status and exits
successfully, so it is safe to run without a browser. When it is present, the
script compiles a representative stylesheet through `Shweet.save` into a
temporary directory, embeds the CSS and DOM fixtures in one self-contained
`data:` page, creates a browser session, sizes the window, navigates to the
page, and compares `getComputedStyle` results obtained with one synchronous
`execute/sync` call. It always deletes the session and removes temporary files.
It uses no sleeps, retries, or polling, and adds no dependency. Because the page
is loaded from a `data:` URL, a remote WebDriver endpoint must permit data-URL
navigation; local browsers normally do.

Coverage:

- overlapping class declarations, including the case where identical
  declarations must not move ahead of an intervening rule;
- adjacent identical declarations merged into one selector list;
- specificity between a class and an id;
- shorthand versus longhand declaration order;
- `!important` against a later normal declaration;
- `min-width` media conditions (the window is resized first; if the viewport
  does not reach the breakpoint, that branch is reported as skipped);
- `@supports` when `CSS.supports` reports the tested declaration as supported,
  otherwise that assertion is reported as skipped and only the fallback is
  checked;
- comma-containing selectors (`[title="a,b"]` and `:is(...)`) that must stay
  one selector expression.

A `PASS` line means every checked assertion succeeded for the browser that was
actually connected. Skipped feature assertions are listed explicitly, and a
run without a configured endpoint establishes no browser evidence. The harness
is not part of `bun test`; it emits only its own status output and never edits
project files.

Type-check the project:

```bash
bunx tsc --noEmit --incremental false
```

The checked-in `tsconfig.json` currently spells `typeRoots` as
`node_module/@types` (missing the `s`). On a clean checkout with no ambient
`node_modules` in an ancestor directory, add
`--typeRoots node_modules/@types` so the installed Node and Bun types are used.
The matrix commands in [Supported toolchain matrix](#supported-toolchain-matrix)
pass that flag explicitly and do not rely on types outside the checkout.

## Known boundaries

- Generated CSS targets the API shown above: property declarations, class/id and
  arbitrary selectors, media/supports conditions, keyframes, simple at-rules,
  font faces, and variables. Block at-rules other than keyframes, supports, and
  font faces are not modeled.
- Grouping preserves source order conservatively and merges only adjacent exact
  matches. It does not attempt global deduplication or cascade equivalence.
- Shweet is not a complete CSS parser. Prefixing, declaration-string handling,
  and minification use bounded token scanners that protect quoted strings,
  `url(...)`, custom properties, and math functions, but unhandled or ambiguous
  syntax is passed through rather than interpreted.
- The [Supported input reference](#supported-input-reference) records which
  behaviors are covered today, but its assertions are string-level only. The
  regular test suite does not claim browser computed-style equivalence; the
  optional harness in `test/browser-cascade.ts` checks it only when a
  `SHWEET_WEBDRIVER_URL` endpoint is connected.
- The packed declarations are bundled into a single self-contained file. They do
  not import `@ohmyqt/u` or any other package, so a consumer can typecheck them
  with `skipLibCheck: false` without installing Shweet's build-time helpers.
  They reference standard DOM types, so the consumer's `lib` should include
  `DOM` (as TypeScript's default libraries do).

Source and issue tracker: [MARKjotep/sweetss](https://github.com/MARKjotep/sweetss).
