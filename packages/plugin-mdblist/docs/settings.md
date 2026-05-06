# Settings

## MdbListSettings

_Object containing the following properties:_

| Property                | Description                           | Type                              | Default |
| :---------------------- | :------------------------------------ | :-------------------------------- | :------ |
| **`apiKey`** (\*)       | Your MdbList API Key                  | `string` (_min length: 1_)        |         |
| `lists`                 | List of MdbList lists to request      | `Array<string (_min length: 1_)>` | `[]`    |
| `updateIntervalSeconds` | Interval in seconds to update content | `number` (_≥0_)                   | `86400` |

_(\*) Required._
