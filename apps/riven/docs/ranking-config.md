# Ranking Configuration

Riven uses a JSON file to configure how torrents are ranked when selecting downloads. On first startup, this file is automatically created at the path specified by the `rankingConfigPath` setting (default: `./riven-ranking-config.json`).

Edit the file while Riven is not running, then restart for changes to take effect.

## Error handling

- **Invalid JSON** — Riven refuses to start and logs an error. Delete the file to regenerate it with defaults, or fix the syntax errors.
- **Unknown keys** — Riven logs a warning and ignores the unrecognised key. The rest of the config is used normally.
- **Wrong value types** — If a section (`settings` or `rankingModel`) contains a value of the wrong type for a known key, Riven logs a warning and falls back to the built-in defaults for that entire section.

---

## Top-level structure

```json
{
  "settings": { ... },
  "rankingModel": { ... }
}
```

---

## `settings`

Controls which torrents are considered and how they are filtered.

### `require`

**Type:** `string[]` | **Default:** `[]`

Patterns that a torrent title **must** match to be considered. Patterns are case-insensitive unless wrapped in `/` delimiters (e.g. `/CaseSensitive/`).

### `exclude`

**Type:** `string[]` | **Default:** `["\\bmatte\\b"]`

Patterns that, when matched, cause a torrent to be rejected entirely.

### `preferred`

**Type:** `string[]` | **Default:** `["\\b4[Kk]|2160p?\\b", "HDR|HDR10"]`

Patterns that boost a torrent's rank when matched.

---

### `resolutions`

Controls which video resolutions are eligible for download.

| Key       | Type      | Default | Description                                |
| --------- | --------- | ------- | ------------------------------------------ |
| `r2160p`  | `boolean` | `true`  | Allow 4K / 2160p                           |
| `r1080p`  | `boolean` | `true`  | Allow 1080p                                |
| `r720p`   | `boolean` | `true`  | Allow 720p                                 |
| `r480p`   | `boolean` | `true`  | Allow 480p                                 |
| `r360p`   | `boolean` | `false` | Allow 360p                                 |
| `unknown` | `boolean` | `true`  | Allow torrents with no detected resolution |

---

### `options`

Fine-grained filtering options.

| Key                       | Type           | Default  | Description                                                                 |
| ------------------------- | -------------- | -------- | --------------------------------------------------------------------------- |
| `removeAllTrash`          | `boolean`      | `true`   | Reject torrents in the `trash` custom rank category                         |
| `removeRanksUnder`        | `number`       | `-10000` | Reject torrents whose total rank falls below this threshold                 |
| `removeUnknownLanguages`  | `boolean`      | `false`  | Reject torrents whose language cannot be determined                         |
| `allowEnglishInLanguages` | `boolean`      | `true`   | Always allow English-language torrents regardless of language filters       |
| `removeAdultContent`      | `boolean`      | `true`   | Reject adult-content torrents                                               |
| `titleSimilarity`         | `number` (0–1) | `0.85`   | Minimum title similarity ratio required for a torrent to match a media item |

---

### `languages`

Language filtering options. Language codes follow the same format used by the indexers (e.g. `"en"`, `"fr"`, `"anime"`).

| Key         | Type       | Default     | Description                                                           |
| ----------- | ---------- | ----------- | --------------------------------------------------------------------- |
| `required`  | `string[]` | `[]`        | Only accept torrents that include all of these languages              |
| `allowed`   | `string[]` | `[]`        | Accept torrents in any of these languages (in addition to `required`) |
| `exclude`   | `string[]` | `[]`        | Reject torrents that include any of these languages                   |
| `preferred` | `string[]` | `["anime"]` | Boost torrents matching these languages                               |

---

### `customRanks`

Controls which quality/format categories are fetched and optionally assigns a custom rank value. Setting `fetch: false` for a category means torrents with that attribute are rejected entirely.

Each entry takes the form:

```json
{ "fetch": true, "rank": 100 }
```

The `rank` field is optional. When omitted, the value from `rankingModel` is used for that category.

#### `customRanks.quality`

| Key      | Default `fetch` | Description                  |
| -------- | --------------- | ---------------------------- |
| `av1`    | `true`          | AV1-encoded video            |
| `avc`    | `true`          | AVC / H.264                  |
| `bluray` | `true`          | Blu-ray source               |
| `dvd`    | `false`         | DVD source                   |
| `hdtv`   | `true`          | HDTV source                  |
| `hevc`   | `true`          | HEVC / H.265                 |
| `mpeg`   | `false`         | MPEG-2 encoded video         |
| `remux`  | `true`          | Remux (lossless Blu-ray rip) |
| `vhs`    | `false`         | VHS source                   |
| `web`    | `true`          | Web source (generic)         |
| `webdl`  | `true`          | WEB-DL                       |
| `webmux` | `false`         | WebMux                       |
| `xvid`   | `false`         | Xvid-encoded video           |

#### `customRanks.rips`

| Key        | Default `fetch` | Description |
| ---------- | --------------- | ----------- |
| `bdrip`    | `true`          | BD-Rip      |
| `brrip`    | `true`          | BR-Rip      |
| `dvdrip`   | `true`          | DVD-Rip     |
| `hdrip`    | `true`          | HD-Rip      |
| `ppvrip`   | `false`         | PPV-Rip     |
| `satrip`   | `false`         | SAT-Rip     |
| `tvrip`    | `true`          | TV-Rip      |
| `uhdrip`   | `true`          | UHD-Rip     |
| `vhsrip`   | `false`         | VHS-Rip     |
| `webdlrip` | `true`          | WEB-DL Rip  |
| `webrip`   | `true`          | WEB-Rip     |

#### `customRanks.hdr`

| Key           | Default `fetch` | Description            |
| ------------- | --------------- | ---------------------- |
| `bit10`       | `true`          | 10-bit colour depth    |
| `dolbyVision` | `true`          | Dolby Vision HDR       |
| `hdr`         | `true`          | HDR (generic)          |
| `hdr10plus`   | `true`          | HDR10+                 |
| `sdr`         | `true`          | Standard Dynamic Range |

#### `customRanks.audio`

| Key                | Default `fetch` | Description                  |
| ------------------ | --------------- | ---------------------------- |
| `aac`              | `true`          | AAC audio                    |
| `atmos`            | `true`          | Dolby Atmos                  |
| `dolbyDigital`     | `true`          | Dolby Digital (AC3)          |
| `dolbyDigitalPlus` | `true`          | Dolby Digital Plus (E-AC3)   |
| `dtsLossy`         | `true`          | DTS (lossy)                  |
| `dtsLossless`      | `true`          | DTS-HD MA / DTS-X (lossless) |
| `flac`             | `true`          | FLAC audio                   |
| `mono`             | `false`         | Mono audio                   |
| `mp3`              | `false`         | MP3 audio                    |
| `stereo`           | `true`          | Stereo audio                 |
| `surround`         | `true`          | Surround sound               |
| `truehd`           | `true`          | Dolby TrueHD                 |

#### `customRanks.extras`

| Key           | Default `fetch` | Description              |
| ------------- | --------------- | ------------------------ |
| `threeD`      | `false`         | 3D video                 |
| `converted`   | `false`         | Format-converted         |
| `documentary` | `true`          | Documentary              |
| `dubbed`      | `true`          | Dubbed audio track       |
| `edition`     | `true`          | Special edition          |
| `hardcoded`   | `true`          | Hardcoded subtitles      |
| `network`     | `true`          | Network tag present      |
| `proper`      | `true`          | PROPER release           |
| `repack`      | `true`          | REPACK release           |
| `retail`      | `true`          | Retail copy              |
| `site`        | `true`          | Release site tag present |
| `subbed`      | `true`          | Subtitled                |
| `upscaled`    | `false`         | AI-upscaled              |
| `scene`       | `true`          | Scene release            |
| `uncensored`  | `true`          | Uncensored content       |

#### `customRanks.trash`

When `removeAllTrash` is `true` in `options`, any torrent matching a trash category is rejected regardless of `fetch` settings.

| Key          | Default `fetch` | Description            |
| ------------ | --------------- | ---------------------- |
| `cam`        | `false`         | CAM recording          |
| `cleanAudio` | `false`         | Clean audio track only |
| `pdtv`       | `false`         | PDTV                   |
| `r5`         | `false`         | R5 (region 5 DVD copy) |
| `screener`   | `false`         | Screener               |
| `size`       | `false`         | Size-tagged release    |
| `telecine`   | `false`         | Telecine               |
| `telesync`   | `false`         | Telesync               |

---

## `rankingModel`

Assigns a numeric score to each torrent attribute. Scores are summed to produce a final rank. Higher values are preferred. Values must be integers.

### Quality

| Key      | Default | Description                  |
| -------- | ------- | ---------------------------- |
| `av1`    | `0`     | AV1 codec                    |
| `avc`    | `0`     | AVC / H.264 codec            |
| `bluray` | `500`   | Blu-ray source               |
| `dvd`    | `0`     | DVD source                   |
| `hdtv`   | `500`   | HDTV source                  |
| `hevc`   | `500`   | HEVC / H.265 codec           |
| `mpeg`   | `0`     | MPEG-2 codec                 |
| `remux`  | `1250`  | Remux (lossless Blu-ray rip) |
| `vhs`    | `0`     | VHS source                   |
| `web`    | `150`   | Web source (generic)         |
| `webdl`  | `1500`  | WEB-DL                       |
| `webmux` | `0`     | WebMux                       |
| `xvid`   | `0`     | Xvid codec                   |

### Rips

| Key        | Default | Description |
| ---------- | ------- | ----------- |
| `bdrip`    | `1000`  | BD-Rip      |
| `brrip`    | `0`     | BR-Rip      |
| `dvdrip`   | `100`   | DVD-Rip     |
| `hdrip`    | `0`     | HD-Rip      |
| `ppvrip`   | `0`     | PPV-Rip     |
| `tvrip`    | `0`     | TV-Rip      |
| `uhdrip`   | `0`     | UHD-Rip     |
| `vhsrip`   | `0`     | VHS-Rip     |
| `webdlrip` | `50`    | WEB-DL Rip  |
| `webrip`   | `50`    | WEB-Rip     |

### HDR

| Key           | Default | Description            |
| ------------- | ------- | ---------------------- |
| `bit10`       | `2750`  | 10-bit colour depth    |
| `dolbyVision` | `3000`  | Dolby Vision HDR       |
| `hdr`         | `2700`  | HDR (generic)          |
| `hdr10plus`   | `2800`  | HDR10+                 |
| `sdr`         | `2300`  | Standard Dynamic Range |

### Audio

| Key                | Default | Description                  |
| ------------------ | ------- | ---------------------------- |
| `aac`              | `1450`  | AAC audio                    |
| `atmos`            | `1500`  | Dolby Atmos                  |
| `dolbyDigital`     | `1450`  | Dolby Digital (AC3)          |
| `dolbyDigitalPlus` | `1450`  | Dolby Digital Plus (E-AC3)   |
| `dtsLossy`         | `1000`  | DTS (lossy)                  |
| `dtsLossless`      | `1450`  | DTS-HD MA / DTS-X (lossless) |
| `flac`             | `1100`  | FLAC audio                   |
| `mono`             | `0`     | Mono audio                   |
| `mp3`              | `0`     | MP3 audio                    |
| `stereo`           | `1050`  | Stereo audio                 |
| `surround`         | `1050`  | Surround sound               |
| `truehd`           | `1450`  | Dolby TrueHD                 |

### Extras

| Key           | Default | Description         |
| ------------- | ------- | ------------------- |
| `threeD`      | `0`     | 3D video            |
| `converted`   | `0`     | Format-converted    |
| `documentary` | `0`     | Documentary         |
| `commentary`  | `0`     | Commentary track    |
| `uncensored`  | `0`     | Uncensored content  |
| `dubbed`      | `0`     | Dubbed audio track  |
| `edition`     | `80`    | Special edition     |
| `hardcoded`   | `50`    | Hardcoded subtitles |
| `network`     | `100`   | Network tag present |
| `proper`      | `300`   | PROPER release      |
| `repack`      | `300`   | REPACK release      |
| `retail`      | `0`     | Retail copy         |
| `subbed`      | `30`    | Subtitled           |
| `upscaled`    | `0`     | AI-upscaled         |
| `scene`       | `0`     | Scene release       |

### Trash

| Key          | Default | Description              |
| ------------ | ------- | ------------------------ |
| `cam`        | `0`     | CAM recording            |
| `cleanAudio` | `0`     | Clean audio track only   |
| `r5`         | `0`     | R5 (region 5 DVD copy)   |
| `pdtv`       | `0`     | PDTV                     |
| `satrip`     | `0`     | SAT-Rip                  |
| `screener`   | `0`     | Screener                 |
| `site`       | `0`     | Release site tag present |
| `size`       | `0`     | Size-tagged release      |
| `telecine`   | `0`     | Telecine                 |
| `telesync`   | `0`     | Telesync                 |
