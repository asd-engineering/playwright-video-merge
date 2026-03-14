import { describe, it, expect } from 'vitest';
import { parseReport, enrichVideosWithReport } from '../../src/report-parser.js';
import { join } from 'node:path';
import type { FoundVideo } from '../../src/types.js';

const REPORT = join(__dirname, '..', 'fixtures', 'playwright-report.json');

describe('parseReport', () => {
  it('should parse playwright-report.json and extract tests', async () => {
    const tests = await parseReport(REPORT);
    expect(tests).toHaveLength(3);
    expect(tests[0].fullTitle).toContain('should display login form');
    expect(tests[0].id).toBe('test-1');
    expect(tests[0].file).toBe('tests/login.pw.ts');
  });

  it('should build folder names for matching', async () => {
    const tests = await parseReport(REPORT);
    expect(tests[0].folderName).toBe('should-display-login-form-chromium');
    expect(tests[2].folderName).toBe('should-load-widgets-chromium');
  });

  it('should throw for non-existent report', async () => {
    await expect(parseReport('/nonexistent/report.json')).rejects.toThrow();
  });
});

describe('enrichVideosWithReport', () => {
  it('should replace display names with full titles from report', async () => {
    const tests = await parseReport(REPORT);
    const videos: FoundVideo[] = [
      {
        path: '/test-results/should-display-login-form-chromium/video.webm',
        displayName: 'should display login form (chromium)',
        mtime: new Date(),
      },
    ];
    const enriched = enrichVideosWithReport(videos, tests);
    expect(enriched[0].displayName).toContain('Login Page');
    expect(enriched[0].displayName).toContain('should display login form');
  });

  it('should keep original name if no match found', async () => {
    const tests = await parseReport(REPORT);
    const videos: FoundVideo[] = [
      {
        path: '/test-results/unknown-test-chromium/video.webm',
        displayName: 'unknown test (chromium)',
        mtime: new Date(),
      },
    ];
    const enriched = enrichVideosWithReport(videos, tests);
    expect(enriched[0].displayName).toBe('unknown test (chromium)');
  });
});
