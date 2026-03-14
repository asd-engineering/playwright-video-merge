# @accelerated-software-development/playwright-video-merge

Merge Playwright test result videos into a single demo reel with test name overlays.

Turn your E2E test recordings into a "what the system can do" demo video — automatically.

## Requirements

- **Node.js** >= 18
- **ffmpeg** installed and in PATH

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Windows
choco install ffmpeg
```

## Installation

```bash
npm install -D @accelerated-software-development/playwright-video-merge
```

## Playwright Video Configuration

By default, Playwright only records videos for failed tests. To create a demo reel, you need to record all tests:

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    video: {
      mode: 'on',  // Record all tests (not just failures)
      size: { width: 1280, height: 720 },
    },
  },
  reporter: [
    ['json', { outputFile: 'playwright-report.json' }],
  ],
});
```

## CLI Usage

```bash
# Basic — merge all videos in test-results/
npx playwright-video-merge

# With test names from report
npx playwright-video-merge --report playwright-report.json

# Custom output format
npx playwright-video-merge -o demo.mp4 -f mp4

# Just concatenate, no overlays
npx playwright-video-merge --no-overlay
```

### CLI Options

```
-i, --input <dir>          Input directory (default: ./test-results)
-o, --output <file>        Output file (default: ./merged-demo.webm)
-r, --report <file>        playwright-report.json for test names
-f, --format <format>      Output format: webm or mp4 (default: webm)
-d, --overlay-duration <s> Overlay duration in seconds (default: 5)
--font <name>              Font name or .ttf path (default: DejaVu Sans)
--font-size <px>           Font size in pixels (default: 24)
--font-color <color>       Font color (default: white)
--box-color <color>        Background box color (default: black@0.5)
--sort <strategy>          alphabetical | report-order | mtime (default: alphabetical)
--no-overlay               Skip overlay, just concatenate
--no-cleanup               Keep intermediate files
-v, --verbose              Verbose output
```

## Programmatic API

```typescript
import { mergePlaywrightVideos } from '@accelerated-software-development/playwright-video-merge';

const result = await mergePlaywrightVideos({
  inputDir: './test-results',
  outputPath: './merged-demo.webm',
  reportPath: './playwright-report.json',
  overlayDuration: 5,
  font: 'DejaVu Sans',
  fontSize: 24,
  fontColor: 'white',
  boxColor: 'black@0.5',
  sort: 'alphabetical',
  cleanup: true,
  onProgress: (event) => {
    console.log(`[${event.stage}] ${event.message}`);
  },
});

console.log(`Merged ${result.videoCount} videos → ${result.outputPath}`);
```

### Check ffmpeg availability

```typescript
import { checkFfmpeg } from '@accelerated-software-development/playwright-video-merge';

const info = checkFfmpeg();
if (!info.available) {
  console.error('ffmpeg is required');
}
```

## npm Script Integration

Add to your `package.json`:

```json
{
  "scripts": {
    "merge-videos": "playwright-video-merge --report playwright-report.json"
  }
}
```

Then run after tests:

```bash
npx playwright test
npm run merge-videos
```

## License

MIT
