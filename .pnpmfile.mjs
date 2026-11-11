// pnpm resolves a package's *optional* peer dependencies whenever the peer is
// present anywhere in the workspace. `better-auth` lists framework integrations
// (Next.js, Vitest, SQLite, ...) as optional peers, so the backend's copy picks
// up the frontend's `next` and ships it, with `sharp`, `@next/swc` and
// Playwright, in the production Docker image (~300MB).
//
// None of these integrations are used, so drop the peers to keep them out of
// the backend's dependency graph.
const UNUSED_BETTER_AUTH_PEERS = new Set(["next", "vitest", "better-sqlite3"]);

function readPackage(pkg) {
  if (pkg.name === "better-auth") {
    for (const peer of UNUSED_BETTER_AUTH_PEERS) {
      delete pkg.peerDependencies?.[peer];
      delete pkg.peerDependenciesMeta?.[peer];
    }
  }

  return pkg;
}

export const hooks = { readPackage };
