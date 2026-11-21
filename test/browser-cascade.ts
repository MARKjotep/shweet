/**
 * Optional browser cascade regression harness.
 *
 * Run against a W3C WebDriver endpoint:
 *
 *   SHWEET_WEBDRIVER_URL=http://localhost:4444 bun test/browser-cascade.ts
 *
 * Without `SHWEET_WEBDRIVER_URL` the script prints a skipped status and exits
 * successfully, so it is safe in environments that have no browser driver.
 *
 * When a driver is available the harness:
 *
 * 1. builds a representative stylesheet through the public `Shweet.save` path
 *    in a temporary directory;
 * 2. embeds the generated CSS and DOM fixtures in one self-contained page;
 * 3. creates a WebDriver session, sizes the window, navigates to the page, and
 *    reads `getComputedStyle` synchronously through `execute/sync`;
 * 4. asserts computed values for the cascade-sensitive cases from `plan.md`;
 * 5. always deletes the session and removes the temporary directory.
 *
 * It deliberately avoids timers, retries, and polling. WebDriver navigation
 * waits for the page load, and computed styles are read in one synchronous
 * script. This file is intentionally not named `*.test.ts`, so `bun test` does
 * not run it.
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { med, ps, Shweet, supports } from "../src";

const PREFIX = "[browser-cascade]";
const REQUEST_TIMEOUT_MS = 30_000;
const WIDE_WINDOW_WIDTH = 1_100;
const WIDE_WINDOW_HEIGHT = 800;
const MD_MIN_WIDTH = 768;

const RED = "rgb(255, 0, 0)";
const BLUE = "rgb(0, 0, 255)";
const GREEN = "rgb(0, 128, 0)";
const PURPLE = "rgb(128, 0, 128)";
const CONTROL = "rgb(1, 2, 3)";

const report = (message: string) => console.log(`${PREFIX} ${message}`);

const toMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

interface PageElement {
  id: string;
  className: string;
  title?: string;
}

/**
 * The DOM fixtures are authored here, not parsed from generated input. IDs are
 * also sent to the browser so every expected element must exist.
 */
const PAGE_ELEMENTS: PageElement[] = [
  { id: "overlap-bc", className: "overlap-b overlap-c" },
  { id: "overlap-ab", className: "overlap-a overlap-b" },
  { id: "adjacent-hello", className: "adjacent-hello" },
  { id: "adjacent-world", className: "adjacent-world" },
  { id: "adjacent-hero", className: "adjacent-hero" },
  { id: "specificity", className: "specificity-class" },
  { id: "shorthand-a", className: "shorthand-a" },
  { id: "shorthand-b", className: "shorthand-b" },
  { id: "important-both", className: "important-a important-b" },
  { id: "important-own", className: "important-a" },
  { id: "important-normal", className: "important-b" },
  { id: "media-box", className: "media-box" },
  { id: "supports-box", className: "supports-box" },
  { id: "separate-attr", className: "separate-attr", title: "a,b" },
  { id: "separate-is-a", className: "separate-is separate-flag-a" },
  { id: "separate-is-b", className: "separate-is separate-flag-b" },
  { id: "separate-nomatch", className: "separate-is" },
  { id: "separate-control", className: "separate-control" },
];

const ELEMENT_IDS = PAGE_ELEMENTS.map((element) => element.id);

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Builds one self-contained document. The generated CSS is embedded in a raw
 * text `<style>` element, so a `</style` sequence would end the element early;
 * refuse that case instead of silently corrupting the page. Static DOM values
 * are HTML-escaped as well.
 */
const buildPage = (css: string): string => {
  if (/<\/style/i.test(css)) {
    throw new Error(
      "generated CSS contains a </style sequence and cannot be embedded safely",
    );
  }

  const body = PAGE_ELEMENTS.map((element) => {
    const title =
      element.title === undefined
        ? ""
        : ` title="${escapeHtml(element.title)}"`;

    return `    <div id="${escapeHtml(element.id)}" class="${escapeHtml(element.className)}"${title}></div>`;
  }).join("\n");

  return [
    "<!doctype html>",
    '<html lang="en">',
    "  <head>",
    '    <meta charset="utf-8">',
    "    <title>Shweet browser cascade harness</title>",
    "    <style>",
    css,
    "    </style>",
    "  </head>",
    "  <body>",
    body,
    "  </body>",
    "</html>",
    "",
  ].join("\n");
};

const SNAPSHOT_SCRIPT = `
return (() => {
  const ids = ${JSON.stringify(ELEMENT_IDS)};
  const elements = {};

  for (const id of ids) {
    const element = document.getElementById(id);

    if (!element) {
      throw new Error("missing fixture element #" + id);
    }

    const style = window.getComputedStyle(element);
    elements[id] = {
      color: style.color,
      backgroundColor: style.backgroundColor,
      marginTop: style.marginTop,
      display: style.display,
    };
  }

  const sheet = document.styleSheets[0];

  return {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    stylesheetCount: document.styleSheets.length,
    ruleCount: sheet ? sheet.cssRules.length : 0,
    supportsDisplayGrid:
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("display", "grid"),
    elements,
  };
})();
`;

interface ElementStyles {
  color: string;
  backgroundColor: string;
  marginTop: string;
  display: string;
}

interface Snapshot {
  innerWidth: number;
  innerHeight: number;
  stylesheetCount: number;
  ruleCount: number;
  supportsDisplayGrid: boolean;
  elements: Record<string, ElementStyles>;
}

const parseSnapshot = (value: unknown): Snapshot => {
  if (!isRecord(value)) {
    throw new Error(
      "WebDriver execute/sync returned a non-object computed-style result",
    );
  }

  const { innerWidth, innerHeight, stylesheetCount, ruleCount } = value;

  if (
    typeof innerWidth !== "number" ||
    typeof innerHeight !== "number" ||
    typeof stylesheetCount !== "number" ||
    typeof ruleCount !== "number" ||
    typeof value.supportsDisplayGrid !== "boolean"
  ) {
    throw new Error(
      "WebDriver execute/sync returned computed-style fields with unexpected types",
    );
  }

  const rawElements = value.elements;

  if (!isRecord(rawElements)) {
    throw new Error(
      "WebDriver execute/sync returned no computed-style element map",
    );
  }

  const elements: Record<string, ElementStyles> = {};

  for (const id of ELEMENT_IDS) {
    const entry = rawElements[id];

    if (!isRecord(entry)) {
      throw new Error(`computed-style result is missing #${id}`);
    }

    const { color, backgroundColor, marginTop, display } = entry;

    if (
      typeof color !== "string" ||
      typeof backgroundColor !== "string" ||
      typeof marginTop !== "string" ||
      typeof display !== "string"
    ) {
      throw new Error(`computed-style result for #${id} has non-string fields`);
    }

    elements[id] = { color, backgroundColor, marginTop, display };
  }

  return {
    innerWidth,
    innerHeight,
    stylesheetCount,
    ruleCount,
    supportsDisplayGrid: value.supportsDisplayGrid,
    elements,
  };
};

interface DriverSession {
  sessionId: string;
  browserName: string | undefined;
  browserVersion: string | undefined;
}

/**
 * Minimal W3C WebDriver client using `fetch` only: status, new session,
 * window rect, navigation, synchronous script execution, and session deletion.
 */
class WebDriverClient {
  readonly endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  private sessionPath(sessionId: string): string {
    return `/session/${encodeURIComponent(sessionId)}`;
  }

  private async request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response: Response;

    try {
      const init: RequestInit = { method, signal: controller.signal };

      if (body !== undefined) {
        init.headers = { "content-type": "application/json" };
        init.body = JSON.stringify(body);
      }

      response = await fetch(`${this.endpoint}${path}`, init);
    } catch (error) {
      const detail = controller.signal.aborted
        ? `timed out after ${REQUEST_TIMEOUT_MS} ms`
        : toMessage(error);

      throw new Error(
        `WebDriver ${method} ${path} could not reach ${this.endpoint}: ${detail}`,
      );
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    let payload: unknown;

    try {
      payload = text.length > 0 ? JSON.parse(text) : undefined;
    } catch {
      payload = undefined;
    }

    if (!response.ok) {
      const value = isRecord(payload) ? payload.value : undefined;
      const message =
        isRecord(value) && typeof value.message === "string"
          ? value.message
          : text.slice(0, 500).trim();

      throw new Error(
        `WebDriver ${method} ${path} failed with HTTP ${response.status}${
          message ? `: ${message}` : ""
        }`,
      );
    }

    if (!isRecord(payload) || !("value" in payload)) {
      throw new Error(
        `WebDriver ${method} ${path} returned a non-W3C response: ${text.slice(
          0,
          500,
        )}`,
      );
    }

    return payload.value;
  }

  async status(): Promise<string | undefined> {
    const value = await this.request("GET", "/status");

    if (!isRecord(value)) return undefined;

    return typeof value.message === "string" ? value.message : undefined;
  }

  async createSession(): Promise<DriverSession> {
    const value = await this.request("POST", "/session", {
      capabilities: { alwaysMatch: {} },
    });

    if (!isRecord(value)) {
      throw new Error("WebDriver POST /session returned no session object");
    }

    const { sessionId } = value;

    if (typeof sessionId !== "string" || sessionId.length === 0) {
      throw new Error(
        "WebDriver POST /session did not return a sessionId; the endpoint may not speak W3C WebDriver",
      );
    }

    const capabilities: Record<string, unknown> = isRecord(value.capabilities)
      ? value.capabilities
      : {};

    return {
      sessionId,
      browserName:
        typeof capabilities.browserName === "string"
          ? capabilities.browserName
          : undefined,
      browserVersion:
        typeof capabilities.browserVersion === "string"
          ? capabilities.browserVersion
          : undefined,
    };
  }

  async setWindowRect(
    sessionId: string,
    width: number,
    height: number,
  ): Promise<void> {
    await this.request("POST", `${this.sessionPath(sessionId)}/window/rect`, {
      width,
      height,
    });
  }

  async navigate(sessionId: string, url: string): Promise<void> {
    await this.request("POST", `${this.sessionPath(sessionId)}/url`, { url });
  }

  async execute<T>(sessionId: string, script: string): Promise<T> {
    const value = await this.request(
      "POST",
      `${this.sessionPath(sessionId)}/execute/sync`,
      { script, args: [] },
    );

    return value as T;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.request("DELETE", this.sessionPath(sessionId));
  }
}

/**
 * Writes the stylesheet through the public save path. The caller owns the
 * temporary directory and removes it after the run.
 */
const buildStylesheet = (directory: string): string => {
  const shweet = new Shweet({ __filename: "/virtual/browser-cascade.ts" });

  // Overlapping class declarations: `.overlap-a` and `.overlap-c` are identical
  // but must not move ahead of `.overlap-b`.
  shweet.c["overlap-a"] = { color: RED };
  shweet.c["overlap-b"] = { color: BLUE };
  shweet.c["overlap-c"] = { color: RED };

  // Adjacent identical declarations are eligible for one selector list.
  shweet.c["adjacent-hello"] = { color: GREEN };
  shweet.c["adjacent-world"] = { color: GREEN };
  shweet.c["adjacent-hero"] = { color: GREEN };

  // Specificity: the id declaration wins over the class declaration.
  shweet.c["specificity-class"] = { color: GREEN };
  shweet.i.specificity = { color: PURPLE };

  // Shorthand and longhand ordering within and across declarations.
  shweet.c["shorthand-a"] = { margin: "0", marginTop: "1px" };
  shweet.c["shorthand-b"] = { marginTop: "1px", margin: "0" };

  // Importance wins regardless of source order.
  shweet.c["important-a"] = { color: `${GREEN} !important` };
  shweet.c["important-b"] = { color: PURPLE };

  // Media condition: the default is below the built-in `md` breakpoint.
  shweet.c["media-box"] = {
    backgroundColor: med(RED, { md: GREEN }),
  };

  // Supports condition: only asserted when the browser supports grid.
  shweet.c["supports-box"] = [
    { display: "block" },
    supports({ display: "grid" })({ display: "grid" }),
  ];

  // Comma-containing expressions that must stay one selector expression.
  shweet.c["separate-attr"] = ps.attr({ title: "a,b" })({ color: RED });
  shweet.c["separate-is"] = ps.is(".separate-flag-a, .separate-flag-b")({
    color: RED,
  });
  shweet.c["separate-control"] = { color: CONTROL };

  shweet.save({ dir: directory, name: "cascade", minify: false });

  return readFileSync(join(directory, "cascade.css"), "utf8");
};

interface Check {
  name: string;
  passed: boolean;
  actual: string;
  expected: string;
}

interface AssertionOutcome {
  checks: Check[];
  skipped: string[];
}

const normalize = (value: string): string =>
  value.replace(/\s+/g, " ").trim().toLowerCase();

const colorChannels = (value: string): number[] | undefined => {
  const match = /^rgba?\(([^)]*)\)$/i.exec(value.trim());

  if (!match || match[1] === undefined) return undefined;

  const channels = match[1]
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map((part) => Number(part));

  if (
    channels.length < 3 ||
    channels.some((channel) => !Number.isFinite(channel))
  ) {
    return undefined;
  }

  return channels.slice(0, 3);
};

/** Compares serialized colors by channel where possible, text otherwise. */
const sameColor = (actual: string, expected: string): boolean => {
  const actualChannels = colorChannels(actual);
  const expectedChannels = colorChannels(expected);

  if (actualChannels && expectedChannels) {
    return actualChannels.every(
      (channel, index) => channel === expectedChannels[index],
    );
  }

  return normalize(actual) === normalize(expected);
};

const samePixels = (actual: string, expected: string): boolean => {
  const actualPixels = Number.parseFloat(actual);
  const expectedPixels = Number.parseFloat(expected);

  if (Number.isFinite(actualPixels) && Number.isFinite(expectedPixels)) {
    return Math.abs(actualPixels - expectedPixels) < 0.01;
  }

  return normalize(actual) === normalize(expected);
};

/**
 * Computed-style assertions for the cascade cases in `plan.md`. Unsupported
 * feature assertions are reported as skipped instead of failing the run.
 */
const runAssertions = (
  snapshot: Snapshot,
  resizeMessage: string | undefined,
): AssertionOutcome => {
  const checks: Check[] = [];
  const skipped: string[] = [];

  const styles = (id: string): ElementStyles => {
    const entry = snapshot.elements[id];

    if (!entry) {
      throw new Error(`computed-style result is missing #${id}`);
    }

    return entry;
  };

  const check = (
    name: string,
    passed: boolean,
    actual: string,
    expected: string,
  ) => {
    checks.push({ name, passed, actual, expected });
  };

  const checkColor = (
    name: string,
    id: string,
    expected: string,
  ): void => {
    const actual = styles(id).color;
    check(name, sameColor(actual, expected), actual, expected);
  };

  const checkDisplay = (
    name: string,
    id: string,
    expected: string,
  ): void => {
    const actual = styles(id).display;
    check(name, normalize(actual) === normalize(expected), actual, expected);
  };

  check(
    "stylesheet parsed",
    snapshot.stylesheetCount >= 1 && snapshot.ruleCount > 0,
    `${snapshot.stylesheetCount} sheet(s), ${snapshot.ruleCount} top-level rule(s)`,
    "at least one parsed stylesheet with a rule",
  );

  checkColor(
    "overlap: .overlap-b.overlap-c keeps the later .overlap-c declaration",
    "overlap-bc",
    RED,
  );
  checkColor(
    "overlap: .overlap-a.overlap-b keeps the later .overlap-b declaration",
    "overlap-ab",
    BLUE,
  );

  for (const id of ["adjacent-hello", "adjacent-world", "adjacent-hero"]) {
    checkColor(`adjacent grouping: #${id} receives the shared declaration`, id, GREEN);
  }

  checkColor(
    "specificity: #specificity beats .specificity-class",
    "specificity",
    PURPLE,
  );

  check(
    "shorthand order: margin-top after margin wins",
    samePixels(styles("shorthand-a").marginTop, "1px"),
    styles("shorthand-a").marginTop,
    "1px",
  );
  check(
    "longhand order: margin after margin-top wins",
    samePixels(styles("shorthand-b").marginTop, "0px"),
    styles("shorthand-b").marginTop,
    "0px",
  );

  checkColor(
    "!important: important beats a later normal declaration",
    "important-both",
    GREEN,
  );
  checkColor(
    "!important: the important declaration applies to its own class",
    "important-own",
    GREEN,
  );
  checkColor(
    "!important: the normal declaration still applies without the important class",
    "important-normal",
    PURPLE,
  );

  if (snapshot.supportsDisplayGrid) {
    checkDisplay(
      "supports: display:grid applies inside @supports",
      "supports-box",
      "grid",
    );
  } else {
    skipped.push(
      "@supports(display:grid) assertion: skipped because CSS.supports('display','grid') is false in this browser",
    );
    checkDisplay(
      "supports fallback: display:block applies without grid support",
      "supports-box",
      "block",
    );
  }

  if (resizeMessage !== undefined) {
    skipped.push(
      `window resize to ${WIDE_WINDOW_WIDTH}x${WIDE_WINDOW_HEIGHT}: ${resizeMessage}`,
    );
  }

  const viewportWidth = snapshot.innerWidth;
  const mediaBackground = styles("media-box").backgroundColor;

  if (viewportWidth >= MD_MIN_WIDTH) {
    check(
      `media: min-width:${MD_MIN_WIDTH} override applies at ${viewportWidth}px`,
      sameColor(mediaBackground, GREEN),
      mediaBackground,
      GREEN,
    );
  } else {
    check(
      `media: default applies below min-width:${MD_MIN_WIDTH} at ${viewportWidth}px`,
      sameColor(mediaBackground, RED),
      mediaBackground,
      RED,
    );
    skipped.push(
      `media min-width:${MD_MIN_WIDTH} override: skipped because the viewport stayed at ${viewportWidth}px`,
    );
  }

  checkColor(
    'separate selector: [title="a,b"] keeps its comma intact',
    "separate-attr",
    RED,
  );
  checkColor(
    "separate selector: :is() matches its first flag",
    "separate-is-a",
    RED,
  );
  checkColor(
    "separate selector: :is() matches its second flag",
    "separate-is-b",
    RED,
  );

  const nonMatchColor = styles("separate-nomatch").color;
  const controlColor = styles("separate-control").color;

  check(
    "separate selector: an element without a flag keeps the control color",
    sameColor(nonMatchColor, controlColor),
    nonMatchColor,
    controlColor,
  );

  return { checks, skipped };
};

const reportOutcome = (outcome: AssertionOutcome): void => {
  for (const check of outcome.checks) {
    if (check.passed) {
      report(`ok   ${check.name} -> ${check.actual}`);
    } else {
      report(
        `FAIL ${check.name}: got ${check.actual}, expected ${check.expected}`,
      );
    }
  }

  for (const note of outcome.skipped) {
    report(`SKIP ${note}`);
  }

  const failures = outcome.checks.filter((check) => !check.passed);

  if (failures.length > 0) {
    throw new Error(
      `${failures.length} of ${outcome.checks.length} browser computed-style checks failed`,
    );
  }

  const suffix =
    outcome.skipped.length > 0 ? ` (${outcome.skipped.length} skipped)` : "";

  report(
    `PASS ${outcome.checks.length}/${outcome.checks.length} computed-style checks passed${suffix}`,
  );
};

const main = async (): Promise<void> => {
  const rawEndpoint = process.env.SHWEET_WEBDRIVER_URL?.trim();

  if (!rawEndpoint) {
    report("SKIPPED: SHWEET_WEBDRIVER_URL is not set.");
    report(
      "Set it to a W3C WebDriver endpoint (for example http://localhost:4444) to run the browser cascade checks.",
    );
    report("No browser session was created; exiting successfully.");
    return;
  }

  const endpoint = rawEndpoint.replace(/\/+$/, "");
  const client = new WebDriverClient(endpoint);

  report(`endpoint: ${endpoint}`);

  try {
    const message = await client.status();
    report(`driver status: ready${message ? ` (${message})` : ""}`);
  } catch (error) {
    report(`warning: driver status check failed: ${toMessage(error)}`);
  }

  const directory = mkdtempSync(join(tmpdir(), "shweet-browser-cascade-"));

  try {
    const css = buildStylesheet(directory);
    const page = buildPage(css);

    writeFileSync(join(directory, "page.html"), page, "utf8");
    report(
      `compiled ${Buffer.byteLength(css, "utf8")} CSS bytes through Shweet.save (${directory})`,
    );

    let session: DriverSession | undefined;
    let deletionError: string | undefined;

    try {
      session = await client.createSession();
      report(
        `session: ${session.sessionId} (${session.browserName ?? "unknown browser"}${
          session.browserVersion ? ` ${session.browserVersion}` : ""
        })`,
      );

      let resizeMessage: string | undefined;

      try {
        await client.setWindowRect(
          session.sessionId,
          WIDE_WINDOW_WIDTH,
          WIDE_WINDOW_HEIGHT,
        );
      } catch (error) {
        resizeMessage = toMessage(error);
      }

      const pageUrl = `data:text/html;base64,${Buffer.from(
        page,
        "utf8",
      ).toString("base64")}`;

      await client.navigate(session.sessionId, pageUrl);
      report(
        `navigated to the self-contained page (${Buffer.byteLength(
          page,
          "utf8",
        )} HTML bytes, data URL)`,
      );

      const snapshot = parseSnapshot(
        await client.execute<unknown>(session.sessionId, SNAPSHOT_SCRIPT),
      );

      report(
        `viewport: ${snapshot.innerWidth}x${snapshot.innerHeight}; stylesheets: ${snapshot.stylesheetCount}; top-level rules: ${snapshot.ruleCount}; CSS.supports('display','grid'): ${String(
          snapshot.supportsDisplayGrid,
        )}`,
      );

      reportOutcome(runAssertions(snapshot, resizeMessage));
    } finally {
      if (session) {
        try {
          await client.deleteSession(session.sessionId);
          report(`session deleted: ${session.sessionId}`);
        } catch (error) {
          deletionError = toMessage(error);
          report(
            `warning: failed to delete session ${session.sessionId}: ${deletionError}`,
          );
        }
      }
    }

    if (deletionError !== undefined) {
      throw new Error(`browser session cleanup failed: ${deletionError}`);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
    report(`temporary files removed: ${directory}`);
  }
};

main().catch((error: unknown) => {
  process.exitCode = 1;
  report(`FAIL: ${toMessage(error)}`);
});
