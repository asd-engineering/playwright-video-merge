import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { platform } from 'node:os';

const FALLBACK_FONTS = ['DejaVu Sans', 'Liberation Sans', 'Arial', 'sans-serif'];

/**
 * Resolve a font for use with ffmpeg's drawtext filter.
 * If the input looks like a file path (contains / or \), validate it exists.
 * Otherwise, treat it as a fontconfig name and verify via fc-list.
 * Returns a drawtext option: either `font=Name` or `fontfile=/path/to/font.ttf`.
 */
export function resolveFont(fontInput?: string): { key: 'font' | 'fontfile'; value: string } {
  // If explicit file path provided, validate it
  if (fontInput && (fontInput.includes('/') || fontInput.includes('\\'))) {
    if (!existsSync(fontInput)) {
      throw new Error(`Font file not found: ${fontInput}`);
    }
    return { key: 'fontfile', value: fontInput };
  }

  // Try fontconfig name — first the requested one, then fallbacks
  const candidates = fontInput ? [fontInput, ...FALLBACK_FONTS] : FALLBACK_FONTS;

  if (platform() === 'win32') {
    // On Windows, fontconfig is typically unavailable — use font name directly
    return { key: 'font', value: candidates[0] };
  }

  for (const name of candidates) {
    if (isFontAvailable(name)) {
      return { key: 'font', value: name };
    }
  }

  // Last resort: use the first candidate and hope ffmpeg can resolve it
  return { key: 'font', value: candidates[0] };
}

function isFontAvailable(name: string): boolean {
  try {
    const result = execSync(`fc-list : family`, { encoding: 'utf8', timeout: 5000 });
    const families = result.split('\n').map(line => line.trim().toLowerCase());
    return families.some(f => f.includes(name.toLowerCase()));
  } catch {
    return false;
  }
}
