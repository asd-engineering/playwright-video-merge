import { execSync } from 'node:child_process';
import { platform } from 'node:os';

export interface FfmpegInfo {
  available: boolean;
  path?: string;
  version?: string;
}

export function checkFfmpeg(): FfmpegInfo {
  try {
    const whichCmd = platform() === 'win32' ? 'where ffmpeg' : 'which ffmpeg';
    const ffmpegPath = execSync(whichCmd, { encoding: 'utf8' }).trim().split('\n')[0];

    const versionOutput = execSync('ffmpeg -version', { encoding: 'utf8' });
    const versionMatch = versionOutput.match(/ffmpeg version (\S+)/);
    const version = versionMatch?.[1] ?? 'unknown';

    return { available: true, path: ffmpegPath, version };
  } catch {
    return { available: false };
  }
}

export function requireFfmpeg(): FfmpegInfo {
  const info = checkFfmpeg();
  if (!info.available) {
    const os = platform();
    const hints: Record<string, string> = {
      linux: 'Install with: sudo apt install ffmpeg  (or: sudo dnf install ffmpeg)',
      darwin: 'Install with: brew install ffmpeg',
      win32: 'Install from: https://ffmpeg.org/download.html  (or: choco install ffmpeg)',
    };
    const hint = hints[os] ?? 'Install ffmpeg from https://ffmpeg.org/download.html';
    throw new Error(`ffmpeg is not installed or not found in PATH.\n${hint}`);
  }
  return info;
}
