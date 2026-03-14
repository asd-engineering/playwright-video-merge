import { describe, it, expect } from 'vitest';
import { resolveFont } from '../../src/font-resolver.js';

describe('resolveFont', () => {
  it('should resolve a file path as fontfile', () => {
    // Use a path that exists on this system
    const result = resolveFont('/usr/share/fonts');
    // Since /usr/share/fonts is a directory not a file, it should still
    // be detected as a path and use fontfile key
    expect(result.key).toBe('fontfile');
  });

  it('should resolve a font name as font', () => {
    const result = resolveFont('DejaVu Sans');
    expect(result.key).toBe('font');
    expect(result.value).toBeTruthy();
  });

  it('should use default fallback when no font specified', () => {
    const result = resolveFont();
    expect(result.key).toBe('font');
    expect(result.value).toBeTruthy();
  });

  it('should throw for non-existent font file path', () => {
    expect(() => resolveFont('/nonexistent/font.ttf')).toThrow('Font file not found');
  });
});
