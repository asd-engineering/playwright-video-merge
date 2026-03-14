import { readdir, stat } from 'node:fs/promises';
import { join, basename, dirname } from 'node:path';
import type { FoundVideo } from './types.js';

/**
 * Recursively find all video.webm files in the given directory.
 */
export async function findVideos(dir: string): Promise<FoundVideo[]> {
  const videos: FoundVideo[] = [];
  await walkDir(dir, videos);
  return videos;
}

async function walkDir(dir: string, results: FoundVideo[]): Promise<void> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return; // Directory doesn't exist or isn't readable
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(fullPath, results);
    } else if (entry.name === 'video.webm') {
      const fileStat = await stat(fullPath);
      const folderName = basename(dirname(fullPath));
      results.push({
        path: fullPath,
        displayName: formatDisplayName(folderName),
        mtime: fileStat.mtime,
      });
    }
  }
}

/**
 * Convert Playwright's folder naming convention to a readable display name.
 * e.g. "login-test-should-display-form-chromium" → "login test should display form (chromium)"
 */
function formatDisplayName(folderName: string): string {
  // Playwright folders: test-title-browser or test-title-browser-retry1
  const browsers = ['chromium', 'firefox', 'webkit'];
  let name = folderName;
  let browser = '';

  for (const b of browsers) {
    const idx = name.lastIndexOf(`-${b}`);
    if (idx !== -1) {
      browser = b;
      name = name.substring(0, idx);
      // Strip retry suffix if present
      const afterBrowser = folderName.substring(idx + b.length + 1);
      if (afterBrowser && afterBrowser.startsWith('-retry')) {
        browser += ` ${afterBrowser.substring(1)}`;
      }
      break;
    }
  }

  // Replace hyphens with spaces
  name = name.replace(/-/g, ' ');

  return browser ? `${name} (${browser})` : name;
}
