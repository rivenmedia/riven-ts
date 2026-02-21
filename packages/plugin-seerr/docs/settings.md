# Settings

## SeerrSettings

_Object containing the following properties:_

| Property          | Description                                                           | Type                       | Default      |
| :---------------- | :-------------------------------------------------------------------- | :------------------------- | :----------- |
| **`apiKey`** (\*) | Your Seerr API Key                                                    | `string` (_min length: 1_) |              |
| **`url`** (\*)    | Your Seerr instance URL (e.g. http://localhost:5055)                  | `string` (_url_)           |              |
| `filter`          | Request status filter (all, approved, available, pending, processing) | `string`                   | `'approved'` |

_(\*) Required._
