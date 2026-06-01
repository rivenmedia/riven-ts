# Settings

## AltmountSettings

_Object containing the following properties:_

| Property                  | Description                                                                                                                                    | Type                       | Default                         |
| :------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------- | :------------------------------ |
| **`altmountUrl`** (\*)    | altmount base URL (e.g. http://10.0.0.66:8081)                                                                                                 | `string` (_url_)           |                                 |
| **`altmountApiKey`** (\*) | altmount SABnzbd-compatible API key                                                                                                            | `string` (_min length: 1_) |                                 |
| `pollIntervalMs`          | How often (ms) to poll the altmount queue while waiting for a download to finish                                                               | `number` (_int, >0_)       | `10000`                         |
| `pollTimeoutMs`           | Maximum total time (ms) to wait before giving up on a download (default: 30 min)                                                               | `number` (_int, >0_)       | `1800000`                       |
| `webdavUrl`               | altmount WebDAV base URL. riven's VFS streams completed downloads from here (e.g. http://altmount:8081/webdav)                                 | `string` (_url_)           | `'http://altmount:8081/webdav'` |
| `webdavUser`              | Username for WebDAV basic auth                                                                                                                 | `string`                   | `'usenet'`                      |
| `webdavPass`              | Password for WebDAV basic auth                                                                                                                 | `string`                   | `'usenet'`                      |
| `webdavRootPath`          | On-disk root that the WebDAV root serves. The SAB history `storage` path is rebased from this prefix onto `webdavUrl` (default: /mnt/altmount) | `string`                   | `'/mnt/altmount'`               |

_(\*) Required._
