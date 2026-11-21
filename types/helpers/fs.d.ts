/**
 * Creates a directory recursively when it does not exist. Existing paths are
 * left untouched.
 */
export declare const ensureDirectory: (path: string) => boolean;
/**
 * Creates a file when it does not exist, without overwriting existing files.
 */
export declare const ensureFile: (path: string, data?: string) => boolean;
