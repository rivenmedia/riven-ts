# rank-torrent-name (TypeScript)

A TypeScript library for parsing and ranking torrent titles based on user preferences.

This is a TypeScript port of the Python [rank-torrent-name](https://github.com/dreulavelle/rank-torrent-name) library.

## Installation

```bash
npm install rank-torrent-name
```

## Quick Start

```typescript
import {
  RTN,
  createDefaultRanking,
  createDefaultSettings,
} from "rank-torrent-name";

// Create an RTN instance with default settings
const rtn = new RTN();

// Or with custom settings
const settings = createDefaultSettings();
settings.resolutions.r2160p = true; // Enable 4K
settings.options.removeAllTrash = true;

const ranking = createDefaultRanking();
const customRtn = new RTN(settings, ranking);

// Rank a torrent
const torrent = rtn.rank(
  "Inception (2010) (2160p HDR BDRip x265 10bit DTS-HD MA 5.1 - r0b0t) [TAoE].mkv",
  "c08a9ee8ce3a5c2c08865e2b05406273cabc97e7",
);

console.log(torrent.rank); // Computed rank score
console.log(torrent.data.quality); // "BDRip"
console.log(torrent.data.codec); // "HEVC"
console.log(torrent.data.resolution); // "2160p"
console.log(torrent.fetch); // true if meets settings criteria
```

## Features

- **Parse torrent titles** - Extract metadata like quality, codec, resolution, audio, HDR, etc.
- **Rank torrents** - Calculate a ranking score based on user preferences
- **Filter torrents** - Determine if a torrent should be fetched based on quality settings
- **Title matching** - Compare titles using Levenshtein distance for similarity
- **Sort torrents** - Sort by resolution bucket and rank

## API

### RTN Class

```typescript
const rtn = new RTN(settings?, rankingModel?);

// Rank a torrent
const torrent = rtn.rank(
  rawTitle: string,
  infohash: string,
  correctTitle?: string,
  removeTrash?: boolean,
  speedMode?: boolean,
  aliases?: Record<string, string[]>
);
```

### Parsing

```typescript
import { parse } from "rank-torrent-name";

const data = parse("Movie.Name.2024.1080p.BluRay.x264-GROUP");
// Returns ParsedData with extracted metadata
```

### Settings Model

```typescript
import { SettingsModelSchema, createDefaultSettings } from "rank-torrent-name";

const settings = createDefaultSettings();

// Customize settings
settings.resolutions.r2160p = true;
settings.resolutions.r720p = false;
settings.options.removeAllTrash = true;
settings.options.titleSimilarity = 0.85;

// Add regex patterns
settings.require = [/1080p/i, /BluRay/i];
settings.exclude = [/CAM/i, /TS/i];
settings.preferred = [/REMUX/i];

// Language settings
settings.languages.required = ["en"];
settings.languages.exclude = ["de", "fr"];
settings.languages.preferred = ["en"];

// Custom ranks for specific attributes
settings.customRanks.quality.remux.useCustomRank = true;
settings.customRanks.quality.remux.rank = 15000;
```

### Ranking Model

```typescript
import {
  BaseRankingModelSchema,
  createDefaultRanking,
} from "rank-torrent-name";

const ranking = createDefaultRanking();

// The default ranking prioritizes high quality:
// - remux: 10000
// - dolbyVision: 3000
// - hdr10plus: 2100
// - hdr: 2000
// - hevc/avc: 500
// - webdl: 200
// - bluray/web: 100
// - cam/telesync: -10000
```

### Utility Functions

```typescript
import {
  Resolution,
  extractEpisodes,
  extractSeasons,
  getLevRatio,
  sortTorrents,
  titleMatch,
} from "rank-torrent-name";

// Sort torrents by resolution and rank
const sorted = sortTorrents(
  new Set([torrent1, torrent2]),
  5, // bucket limit
  [Resolution.FHD_1080P, Resolution.UHD_2160P],
);

// Title matching
const isMatch = titleMatch("Inception", "inception 2010", 0.85);
const ratio = getLevRatio("Inception", "inception 2010");

// Extract season/episode info
const seasons = extractSeasons("Show.S01E05.720p.HDTV"); // [1]
const episodes = extractEpisodes("Show.S01E05.720p.HDTV"); // [5]
```

## ParsedData Fields

| Field             | Type           | Description                               |
| ----------------- | -------------- | ----------------------------------------- |
| `rawTitle`        | string         | Original torrent title                    |
| `parsedTitle`     | string         | Extracted title name                      |
| `normalizedTitle` | string         | Normalized title for matching             |
| `year`            | number \| null | Release year                              |
| `resolution`      | string         | Video resolution (e.g., "1080p", "2160p") |
| `quality`         | string \| null | Source quality (e.g., "BluRay", "WEB-DL") |
| `codec`           | string \| null | Video codec (e.g., "HEVC", "AVC")         |
| `audio`           | string[]       | Audio formats                             |
| `channels`        | string[]       | Audio channels                            |
| `hdr`             | string[]       | HDR formats                               |
| `seasons`         | number[]       | Season numbers                            |
| `episodes`        | number[]       | Episode numbers                           |
| `languages`       | string[]       | Languages                                 |
| `group`           | string \| null | Release group                             |
| `extended`        | boolean        | Extended edition                          |
| `proper`          | boolean        | Proper release                            |
| `repack`          | boolean        | Repack release                            |
| `remux`           | boolean        | Remux release                             |
| `hardcoded`       | boolean        | Hardcoded subtitles                       |

## Exceptions

```typescript
import { GarbageTorrent, SettingsDisabled } from "rank-torrent-name";

try {
  const torrent = rtn.rank(title, hash, correctTitle, true);
} catch (error) {
  if (error instanceof GarbageTorrent) {
    console.log("Torrent rejected:", error.message);
  }
  if (error instanceof SettingsDisabled) {
    console.log("Settings are disabled");
  }
}
```

## License

MIT
