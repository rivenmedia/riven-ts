# Settings

## ListrrSettings

_Object containing the following properties:_

| Property          | Description                           | Type                              | Default |
| :---------------- | :------------------------------------ | :-------------------------------- | :------ |
| `enabled`         | Whether the plugin is enabled or not. | `boolean`                         | `true`  |
| **`apiKey`** (\*) | Your Listrr API Key                   | `string` (_min length: 1_)        |         |
| `movieLists`      | List of Listrr movie lists to request | `Array<string (_min length: 1_)>` | `[]`    |
| `showLists`       | List of Listrr show lists to request  | `Array<string (_min length: 1_)>` | `[]`    |

_(\*) Required._
