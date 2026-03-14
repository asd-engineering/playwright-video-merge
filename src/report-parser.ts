import { readFile } from 'node:fs/promises';
import type { ReportTest, FoundVideo } from './types.js';

interface PlaywrightReport {
  suites: PlaywrightSuite[];
}

interface PlaywrightSuite {
  title: string;
  suites?: PlaywrightSuite[];
  specs?: PlaywrightSpec[];
}

interface PlaywrightSpec {
  title: string;
  file: string;
  tests: PlaywrightTest[];
}

interface PlaywrightTest {
  id: string;
  projectName: string;
  results: PlaywrightResult[];
}

interface PlaywrightResult {
  status: string;
  attachments?: PlaywrightAttachment[];
}

interface PlaywrightAttachment {
  name: string;
  path?: string;
}

/**
 * Parse playwright-report.json and extract test information.
 */
export async function parseReport(reportPath: string): Promise<ReportTest[]> {
  const content = await readFile(reportPath, 'utf8');
  const report: PlaywrightReport = JSON.parse(content);
  const tests: ReportTest[] = [];

  for (const suite of report.suites) {
    walkSuites(suite, [], tests);
  }

  return tests;
}

function walkSuites(suite: PlaywrightSuite, path: string[], results: ReportTest[]): void {
  const currentPath = [...path, suite.title].filter(Boolean);

  if (suite.suites) {
    for (const s of suite.suites) {
      walkSuites(s, currentPath, results);
    }
  }

  if (suite.specs) {
    for (const spec of suite.specs) {
      for (const test of spec.tests) {
        const fullTitle = [...currentPath, spec.title].filter(Boolean).join(' > ');
        results.push({
          id: test.id,
          file: spec.file,
          fullTitle,
          folderName: buildFolderName(spec.title, test.projectName),
        });
      }
    }
  }
}

/**
 * Reconstruct the folder name Playwright creates for test artifacts.
 * Playwright uses: kebab-case-of-test-title-browserName
 */
function buildFolderName(specTitle: string, projectName: string): string {
  const kebab = specTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${kebab}-${projectName}`;
}

/**
 * Enrich found videos with full test titles from the report.
 * Matches videos to report entries by comparing folder names.
 */
export function enrichVideosWithReport(videos: FoundVideo[], reportTests: ReportTest[]): FoundVideo[] {
  return videos.map(video => {
    const folderName = video.path.split('/').at(-2) ?? '';
    const match = reportTests.find(t =>
      t.folderName && folderName.includes(t.folderName)
    );
    if (match) {
      return { ...video, displayName: match.fullTitle };
    }
    return video;
  });
}
