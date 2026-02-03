# Settings

## PlexSettings

_Object containing the following properties:_

| Property                 | Description                                                                                                                         | Type                       | Default    |
| :----------------------- | :---------------------------------------------------------------------------------------------------------------------------------- | :------------------------- | :--------- |
| **`plexToken`** (\*)     | Plex Token for accessing the Plex API. See https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/ | `string` (_min length: 1_) |            |
| **`plexServerUrl`** (\*) | The URL of your Plex server, e.g., http://localhost:32400/                                                                          | `string` (_url_)           |            |
| `plexLibraryPath`        | The start of Plex library paths, e.g. "/mount" in "/mount/movies"                                                                   | `string` (_min length: 1_) | `'/mount'` |

_(\*) Required._
