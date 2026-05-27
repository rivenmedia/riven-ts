# @repo/plugin-newznab

Riven plugin that scrapes Usenet indexers via the [Newznab](https://newznab.readthedocs.io/en/latest/misc/api/) API.

## Overview

Handles the `riven.media-item.nzb-scrape.requested` hook. Queries a configured
Newznab-compatible indexer (e.g. NZBgeek, DrunkenSlug, NZBPlanet) for NZB
candidates matching the requested media item, applies size filtering, and
returns up to 10 candidates sorted by publication date (newest first).

## Settings

See [docs/settings.md](./docs/settings.md) for the full settings reference.

| Setting           | Default                 | Description                     |
| ----------------- | ----------------------- | ------------------------------- |
| `indexerUrl`      | _(required)_            | Base URL of the Newznab indexer |
| `apiKey`          | _(required)_            | Newznab API key                 |
| `minSizeBytes`    | `104857600` (100 MB)    | Minimum NZB size to accept      |
| `maxSizeBytes`    | `107374182400` (100 GB) | Maximum NZB size to accept      |
| `movieCategories` | `[2040, 2045]`          | HD and UHD movie categories     |
| `tvCategories`    | `[5040, 5045]`          | HD and UHD TV categories        |
