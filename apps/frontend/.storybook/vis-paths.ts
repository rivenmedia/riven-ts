/**
 * When set, Vitest connects to a browser running in the pinned Playwright container
 * instead of launching one locally, so snapshots render identically on every machine.
 */
export const browserWsEndpoint = process.env["VIS_BROWSER_WS_ENDPOINT"];

/** Committed baselines, rendered by the Playwright container (CI and `test:component:docker`) */
export const containerSnapshotRootDir = "__vis__/docker";

/** Git-ignored snapshots, rendered by a locally launched browser for quick before/after comparisons */
export const localSnapshotRootDir = "__vis__/local";

export const snapshotRootDir = browserWsEndpoint
  ? containerSnapshotRootDir
  : localSnapshotRootDir;
