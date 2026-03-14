import { describe, it, expect, beforeAll } from 'vitest';
import { mergePlaywrightVideos, checkFfmpeg } from '../../src/index.js';
import { join } from 'node:path';
import { existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';

const FIXTURES = join(__dirname, '..', 'fixtures');
const hasFfmpeg = checkFfmpeg().available;

describe.skipIf(!hasFfmpeg)('mergePlaywrightVideos (integration)', () => {
  it('should merge fixture videos into a single output', async () => {
    const output = join(tmpdir(), `pvmerge-test-${randomBytes(4).toString('hex')}.webm`);

    try {
      const result = await mergePlaywrightVideos({
        inputDir: join(FIXTURES, 'test-results'),
        outputPath: output,
        noOverlay: true, // Skip overlay to speed up test
        cleanup: true,
      });

      expect(result.videoCount).toBe(3);
      expect(result.outputPath).toBe(output);
      expect(existsSync(output)).toBe(true);
    } finally {
      if (existsSync(output)) unlinkSync(output);
    }
  });

  it('should merge with overlay', async () => {
    const output = join(tmpdir(), `pvmerge-overlay-${randomBytes(4).toString('hex')}.webm`);

    try {
      const progressEvents: string[] = [];
      const result = await mergePlaywrightVideos({
        inputDir: join(FIXTURES, 'test-results'),
        outputPath: output,
        overlayDuration: 1,
        cleanup: true,
        onProgress: (e) => progressEvents.push(e.stage),
      });

      expect(result.videoCount).toBe(3);
      expect(existsSync(output)).toBe(true);
      expect(progressEvents).toContain('finding');
      expect(progressEvents).toContain('overlaying');
      expect(progressEvents).toContain('merging');
      expect(progressEvents).toContain('done');
    } finally {
      if (existsSync(output)) unlinkSync(output);
    }
  }, 60000);

  it('should use report for display names', async () => {
    const output = join(tmpdir(), `pvmerge-report-${randomBytes(4).toString('hex')}.webm`);

    try {
      const result = await mergePlaywrightVideos({
        inputDir: join(FIXTURES, 'test-results'),
        outputPath: output,
        reportPath: join(FIXTURES, 'playwright-report.json'),
        noOverlay: true,
        cleanup: true,
      });

      expect(result.videoCount).toBe(3);
    } finally {
      if (existsSync(output)) unlinkSync(output);
    }
  });

  it('should throw for empty directory', async () => {
    await expect(
      mergePlaywrightVideos({
        inputDir: join(FIXTURES, 'nonexistent'),
        outputPath: '/tmp/should-not-exist.webm',
      })
    ).rejects.toThrow('No video.webm files found');
  });
});
