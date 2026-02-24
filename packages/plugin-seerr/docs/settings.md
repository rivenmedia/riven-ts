# Settings

## SeerrSettings

_Object containing the following properties:_

| Property          | Description                                                                | Type                                                                                                                       | Default                   |
| :---------------- | :------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- | :------------------------ |
| **`apiKey`** (\*) | Your Seerr API Key                                                         | `string` (_min length: 1_)                                                                                                 |                           |
| `url`             | Your Seerr instance URL (e.g. http://localhost:5055)                       | `string` (_url_)                                                                                                           | `'http://localhost:5055'` |
| `filter`          | Request status filter (all, approved, available, pending, processing, ...) | `'all' \| 'approved' \| 'available' \| 'pending' \| 'processing' \| 'unavailable' \| 'failed' \| 'deleted' \| 'completed'` | `'approved'`              |

_(\*) Required._
