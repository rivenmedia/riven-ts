# Settings

## RivenSettings

_Object containing the following properties:_

| Property                         | Description                                                                         | Type                                                                       | Default              |
| :------------------------------- | :---------------------------------------------------------------------------------- | :------------------------------------------------------------------------- | :------------------- |
| **`databaseUrl`** (\*)           | The database connection URL.                                                        | `string` (_url_)                                                           |                      |
| **`redisUrl`** (\*)              | The Redis server URL.                                                               | `string` (_url_)                                                           |                      |
| `vfsDebugLogging`                | Enable debug logging for the virtual file system.                                   | `boolean`                                                                  | `false`              |
| **`vfsMountPath`** (\*)          | The mount point for the virtual file system.                                        | `string`                                                                   |                      |
| `unsafeClearQueuesOnStartup`     | **UNSAFE**.<br /> <br />If true, all queues will be cleared on application startup. | `boolean`                                                                  | `false`              |
| `unsafeRefreshDatabaseOnStartup` | **UNSAFE**.<br /> <br />If true, the database will be wiped on application startup. | `boolean`                                                                  | `false`              |
| `enabledLogTransports`           | The enabled logging transports.                                                     | `Array<'console' \| 'file'>`                                               | `["console","file"]` |
| `loggingEnabled`                 | Enable or disable logging for the application.                                      | `boolean`                                                                  | `true`               |
| `logLevel`                       | The logging level for the application.                                              | `'error' \| 'warn' \| 'info' \| 'http' \| 'verbose' \| 'debug' \| 'silly'` | `'info'`             |
| `logDirectory`                   | The directory where log files will be stored.                                       | `string`                                                                   | `'./logs'`           |
| `jaegerUrl`                      | The Jaeger tracing server URL.                                                      | `string` (_url_)                                                           |                      |
| `gqlPort`                        | The GraphQL server port.                                                            | `number` (_int_)                                                           | `3000`               |

_(\*) Required._
