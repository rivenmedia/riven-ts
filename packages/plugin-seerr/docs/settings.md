# Settings

## SeerrSettings

_Object containing the following properties:_

| Property                         | Description                                                                                                                                                | Type                                                                                                                       | Default                   |
| :------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- | :------------------------ |
| **`apiKey`** (\*)                | Your Seerr API Key                                                                                                                                         | `string` (_min length: 1_)                                                                                                 |                           |
| `url`                            | Your Seerr instance URL (e.g. http://localhost:5055)                                                                                                       | `string` (_url_)                                                                                                           | `'http://localhost:5055'` |
| `filter`                         | Request status filter (all, approved, available, pending, processing, ...)                                                                                 | `'all' \| 'approved' \| 'available' \| 'pending' \| 'processing' \| 'unavailable' \| 'failed' \| 'deleted' \| 'completed'` | `'approved'`              |
| **`updateIntervalSeconds`** (\*) | Interval in seconds to update content. If using the webhook, set to `null` to disable automatic updates (an initial request will still be made on startup) | `number` (_≥0_) (_nullable_)                                                                                               | `60`                      |

_(\*) Required._
