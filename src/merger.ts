import ffmpeg from 'fluent-ffmpeg';
import { resolve as resolvePath, dirname } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { findVideos } from './video-finder.js';
import { parseReport, enrichVideosWithReport } from './report-parser.js';
import { addOverlay } from './overlay.js';
import { cleanupFiles } from './cleanup.js';
import { requireFfmpeg } from './ffmpeg-check.js';
import type { MergeOptions, MergeResult, FoundVideo, ProgressEvent } from './types.js';

const DEFAULTS: Required<Omit<MergeOptions, 'reportPath' | 'onProgress'>> = {
  inputDir: './test-results',
  outputPath: './merged-demo.webm',
  format: 'webm',
  overlayDuration: 5,
  font: 'DejaVu Sans',
  fontSize: 24,
  fontColor: 'white',
  boxColor: 'black@0.5',
  sort: 'alphabetical',
  cleanup: true,
  noOverlay: false,
};

function emit(opts: MergeOptions, event: ProgressEvent): void {
  opts.onProgress?.(event);
}

function sortVideos(videos: FoundVideo[], strategy: string): FoundVideo[] {
  const sorted = [...videos];
  switch (strategy) {
    case 'mtime':
      sorted.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
      break;
    case 'report-order':
      // Already in report order if enriched; otherwise alphabetical fallback
      break;
    case 'alphabetical':
    default:
      sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
      break;
  }
  return sorted;
}

function mergeVideoFiles(inputPaths: string[], outputPath: string, format: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    for (const p of inputPaths) {
      command.input(p);
    }

    if (format === 'mp4') {
      command.outputOptions(['-c:v', 'libx264', '-c:a', 'aac']);
    }

    command
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(new Error(`Merge failed: ${err.message}`)))
      .mergeToFile(outputPath, tmpdir());
  });
}

export async function merge(userOptions: MergeOptions = {}): Promise<MergeResult> {
  const opts = { ...DEFAULTS, ...userOptions };
  const inputDir = resolvePath(opts.inputDir);
  const outputPath = resolvePath(opts.outputPath);

  // Ensure ffmpeg is available
  requireFfmpeg();

  // Step 1: Find videos
  emit(opts, { stage: 'finding', message: `Searching for videos in ${inputDir}` });
  let videos = await findVideos(inputDir);

  if (videos.length === 0) {
    throw new Error(`No video.webm files found in ${inputDir}`);
  }

  // Enrich with report data if available
  if (opts.reportPath) {
    try {
      const reportTests = await parseReport(resolvePath(opts.reportPath));
      videos = enrichVideosWithReport(videos, reportTests);
    } catch {
      // Report parsing failed — continue with folder names
    }
  }

  // Sort
  videos = sortVideos(videos, opts.sort);

  emit(opts, { stage: 'finding', current: videos.length, total: videos.length, message: `Found ${videos.length} videos` });

  // Step 2: Add overlays (or just use originals)
  const tempFiles: string[] = [];
  let processedPaths: string[];

  if (opts.noOverlay) {
    processedPaths = videos.map(v => v.path);
  } else {
    processedPaths = [];
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      emit(opts, {
        stage: 'overlaying',
        current: i + 1,
        total: videos.length,
        message: `Adding overlay ${i + 1}/${videos.length}: ${video.displayName}`,
      });

      const processedPath = await addOverlay(video.path, video.displayName, opts);
      processedPaths.push(processedPath);
      tempFiles.push(processedPath);
    }
  }

  // Step 3: Merge all videos
  emit(opts, { stage: 'merging', message: `Merging ${processedPaths.length} videos...` });
  await mkdir(dirname(outputPath), { recursive: true });
  await mergeVideoFiles(processedPaths, outputPath, opts.format);

  // Step 4: Cleanup temp files
  if (opts.cleanup && tempFiles.length > 0) {
    emit(opts, { stage: 'cleanup', message: 'Cleaning up temporary files...' });
    await cleanupFiles(tempFiles);
  }

  emit(opts, { stage: 'done', message: `Merged ${videos.length} videos → ${outputPath}` });

  return {
    outputPath,
    videoCount: videos.length,
  };
}
