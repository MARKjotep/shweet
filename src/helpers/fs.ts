import { existsSync, mkdirSync, writeFileSync } from "node:fs";

/**
 * Creates a directory recursively when it does not exist. Existing paths are
 * left untouched.
 */
export const ensureDirectory = (path: string): boolean => {
  if (existsSync(path)) return true;

  mkdirSync(path, { recursive: true });
  return true;
};

/**
 * Creates a file when it does not exist, without overwriting existing files.
 */
export const ensureFile = (path: string, data: string = ""): boolean => {
  if (existsSync(path)) return true;

  writeFileSync(path, data, { flag: "wx" });
  return true;
};
