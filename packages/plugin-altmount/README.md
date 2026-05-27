# @repo/plugin-altmount

Riven plugin: submits NZBs to a running altmount instance and polls until completion.

## Settings

| Field            | Type         | Required | Default | Description                                      |
| ---------------- | ------------ | -------- | ------- | ------------------------------------------------ |
| `altmountUrl`    | string (URL) | yes      |         | altmount base URL (e.g. `http://10.0.0.66:8081`) |
| `altmountApiKey` | string       | yes      |         | altmount SAB API key                             |
| `pollIntervalMs` | number       | no       | 10000   | Poll interval (ms)                               |
| `pollTimeoutMs`  | number       | no       | 1800000 | Max poll duration (30 min)                       |

## Hook

- `riven.media-item.nzb-download.requested` — submits an NZB URL to altmount's `?mode=addurl`, then polls `?mode=queue` and `?mode=history` until the job reaches a terminal status (`Completed` or `Failed`).
