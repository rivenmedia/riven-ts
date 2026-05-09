# Settings

## ListrrSettings

_Object containing the following properties:_

| Property                | Description                           | Type                              | Default |
| :---------------------- | :------------------------------------ | :-------------------------------- | :------ |
| **`apiKey`** (\*)       | Your Listrr API Key                   | `string` (_min length: 1_)        |         |
| `movieLists`            | List of Listrr movie lists to request | `Array<string (_min length: 1_)>` | `[]`    |
| `showLists`             | List of Listrr show lists to request  | `Array<string (_min length: 1_)>` | `[]`    |
| `updateIntervalSeconds` | Interval in seconds to update content | `number` (_≥0_)                   | `86400` |

_(\*) Required._
