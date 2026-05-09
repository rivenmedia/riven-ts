# Settings

## JellyfinSettings

_Object containing the following properties:_

| Property                     | Description                                                           | Type                       | Default    |
| :--------------------------- | :-------------------------------------------------------------------- | :------------------------- | :--------- |
| **`jellyfinToken`** (\*)     | Jellyfin Token for accessing the Jellyfin API.                        | `string` (_min length: 1_) |            |
| **`jellyfinServerUrl`** (\*) | The URL of your Jellyfin server, e.g., http://localhost:8096/         | `string` (_url_)           |            |
| `jellyfinLibraryPath`        | The start of Jellyfin library paths, e.g. "/mount" in "/mount/movies" | `string` (_min length: 1_) | `'/mount'` |

_(\*) Required._
