# Settings

## RivenSettings

_Object containing the following properties:_

| Property                         | Description                                                                                                                                | Type                                                                       | Default              |
| :------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------- | :------------------- |
| **`databaseUrl`** (\*)           | The database connection URL.                                                                                                               | `string` (_url_)                                                           |                      |
| **`redisUrl`** (\*)              | The Redis server URL.                                                                                                                      | `string` (_url_)                                                           |                      |
| `vfsDebugLogging`                | Enable debug logging for the virtual file system.                                                                                          | `boolean`                                                                  | `false`              |
| **`vfsMountPath`** (\*)          | The mount point for the virtual file system.                                                                                               | `string`                                                                   |                      |
| `vfsForceMount`                  | If true, attempts to unmount the mount-point before remounting.                                                                            | `boolean`                                                                  | `true`               |
| `unsafeClearQueuesOnStartup`     | **UNSAFE**.<br /> <br />If true, all queues will be cleared on application startup.                                                        | `boolean`                                                                  | `false`              |
| `unsafeRefreshDatabaseOnStartup` | **UNSAFE**.<br /> <br />If true, the database will be wiped on application startup.                                                        | `boolean`                                                                  | `false`              |
| `enabledLogTransports`           | The enabled logging transports.                                                                                                            | `Array<'console' \| 'file'>`                                               | `["console","file"]` |
| `loggingEnabled`                 | Enable or disable logging for the application.                                                                                             | `boolean`                                                                  | `true`               |
| `logLevel`                       | The logging level for the application.                                                                                                     | `'error' \| 'warn' \| 'info' \| 'http' \| 'verbose' \| 'debug' \| 'silly'` | `'info'`             |
| `logDirectory`                   | The directory where log files will be stored.                                                                                              | `string`                                                                   | `'./logs'`           |
| `logShowStackTraces`             | Whether to show detailed stack traces when logging errors                                                                                  | `boolean`                                                                  | `true`               |
| `dubbedAnimeOnly`                | Only scrape dubbed anime.                                                                                                                  | `boolean`                                                                  | `false`              |
| `minimumAverageBitrateMovies`    | The minimum average bitrate for movies.                                                                                                    | `number` (_>0_)                                                            |                      |
| `minimumAverageBitrateEpisodes`  | The minimum average bitrate for episodes.                                                                                                  | `number` (_>0_)                                                            |                      |
| `scheduleOffsetMinutes`          | The number of minutes to wait after an item's air date before attempting to re-index it.                                                   | `number` (_≥0_)                                                            | `30`                 |
| `unknownAirDateOffsetDays`       | When an episode has no air date, this number of days will be added to the current date to estimate a release date for scheduling purposes. | `number` (_≥0_)                                                            | `7`                  |

_(\*) Required._
