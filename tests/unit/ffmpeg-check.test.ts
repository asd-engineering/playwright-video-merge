import { describe, it, expect } from 'vitest';
import { checkFfmpeg, requireFfmpeg } from '../../src/ffmpeg-check.js';

describe('checkFfmpeg', () => {
  it('should return availability info', () => {
    const info = checkFfmpeg();
    // On this system ffmpeg is available
    expect(typeof info.available).toBe('boolean');
    if (info.available) {
      expect(info.path).toBeTruthy();
      expect(info.version).toBeTruthy();
    }
  });
});

describe('requireFfmpeg', () => {
  it('should not throw when ffmpeg is available', () => {
    const info = checkFfmpeg();
    if (info.available) {
      expect(() => requireFfmpeg()).not.toThrow();
    }
  });
});
