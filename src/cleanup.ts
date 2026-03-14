import { unlink } from 'node:fs/promises';

/**
 * Remove a list of temporary files, ignoring errors for files that don't exist.
 */
export async function cleanupFiles(paths: string[]): Promise<void> {
  await Promise.allSettled(paths.map(p => unlink(p)));
}
