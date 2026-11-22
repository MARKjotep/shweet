import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Shweet } from "../src";

const temporaryDirectories: string[] = [];

const temporaryDirectory = (name: string) => {
  const directory = mkdtempSync(join(tmpdir(), `shweet-${name}-`));
  temporaryDirectories.push(directory);
  return directory;
};

afterAll(() => {
  temporaryDirectories.forEach((directory) => {
    rmSync(directory, { recursive: true, force: true });
  });
});

const sourcePath = (root: string) =>
  join(root, "views", "home", "css", "home.css.ts");

const createPage = (root: string) => {
  const shweet = new Shweet({ __filename: sourcePath(root), prefix: "x" });

  shweet.c.hero = { color: "red" };
  shweet.c.card = { backgroundColor: "blue" };

  return shweet;
};

const readBytes = (filePath: string) => readFileSync(filePath);

describe('save with dir: "parent"', () => {
  test("writes byte-identical output to an explicit parent/mapDir save", () => {
    const tokenRoot = temporaryDirectory("parent-token");
    const controlRoot = temporaryDirectory("parent-control");

    createPage(tokenRoot).save({ dir: "parent", minify: true });

    const controlSource = sourcePath(controlRoot);
    createPage(controlRoot).save({
      dir: dirname(dirname(controlSource)),
      mapDir: dirname(controlSource),
      minify: true,
    });

    const tokenCss = join(tokenRoot, "views", "home", "home.css");
    const tokenMap = join(tokenRoot, "views", "home", "css", "index.js");
    const controlCss = join(controlRoot, "views", "home", "home.css");
    const controlMap = join(controlRoot, "views", "home", "css", "index.js");

    expect(existsSync(tokenCss)).toBe(true);
    expect(existsSync(tokenMap)).toBe(true);
    expect(readBytes(tokenCss).equals(readBytes(controlCss))).toBe(true);
    expect(readBytes(tokenMap).equals(readBytes(controlMap))).toBe(true);

    const map = readFileSync(tokenMap, "utf8");
    expect(map).toBe('export const card="x_card",hero="x_hero";');
    expect(map).not.toBe("export {}");
  });

  test("keeps name and mapName overrides with an explicit mapDir", () => {
    const root = temporaryDirectory("parent-overrides");

    createPage(root).save({
      dir: "parent",
      mapDir: join(root, "maps"),
      mapName: "map",
      name: "styles",
      minify: true,
    });

    expect(existsSync(join(root, "views", "home", "styles.css"))).toBe(true);
    expect(existsSync(join(root, "maps", "map.js"))).toBe(true);
  });

  test("uses real folders named parent literally for dir and mapDir", () => {
    const root = temporaryDirectory("parent-literal");
    const output = join(root, "views", "home", "parent");

    createPage(root).save({ dir: output, mapDir: output, minify: true });

    expect(existsSync(join(output, "home.css"))).toBe(true);
    expect(existsSync(join(output, "index.js"))).toBe(true);
    // The token would write beside the source folder instead.
    expect(existsSync(join(root, "views", "home", "home.css"))).toBe(false);
  });

  test("keeps a literal parent entry inside a dir array", () => {
    const root = temporaryDirectory("parent-array");
    const output = join(root, "parent");

    createPage(root).save({ dir: [output], mapDir: [], minify: true });

    expect(existsSync(join(output, "home.css"))).toBe(true);
    expect(existsSync(join(root, "views", "home", "home.css"))).toBe(false);
  });

  test("refuses to resolve a module at the filesystem root", () => {
    const shweet = new Shweet({ __filename: "/home.css.ts" });
    shweet.c.a = { color: "red" };

    expect(() => shweet.save({ dir: "parent" })).toThrow(
      /dir: "parent" cannot resolve/,
    );
    expect(existsSync("/home.css")).toBe(false);
  });
});
