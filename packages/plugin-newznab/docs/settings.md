# Settings

## NewznabSettings

_Object containing the following properties:_

| Property              | Description                                                                   | Type                       | Default        |
| :-------------------- | :---------------------------------------------------------------------------- | :------------------------- | :------------- |
| **`indexerUrl`** (\*) | Base URL of the Newznab-compatible indexer (e.g. https://indexer.example.com) | `string` (_url_)           |                |
| **`apiKey`** (\*)     | API key for authenticating with the Newznab indexer                           | `string` (_min length: 1_) |                |
| `minSizeBytes`        | Minimum NZB file size in bytes to accept as a candidate (default: 100 MB)     | `number` (_int, ≥0_)       | `104857600`    |
| `maxSizeBytes`        | Maximum NZB file size in bytes to accept as a candidate (default: 100 GB)     | `number` (_int, ≥0_)       | `107374182400` |
| `movieCategories`     | Newznab category IDs to query for movies (default: 2040 HD, 2045 UHD)         | `Array<number (_int_)>`    | `[2040,2045]`  |
| `tvCategories`        | Newznab category IDs to query for TV shows (default: 5040 HD, 5045 UHD)       | `Array<number (_int_)>`    | `[5040,5045]`  |

_(\*) Required._
