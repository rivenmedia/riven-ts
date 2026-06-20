import packageJson from "../package.json" with { type: "json" };

export const workspaceImports = Object.keys(packageJson.devDependencies).filter(
  (dep) =>
    dep.startsWith("@repo/plugin-") ||
    dep === "@repo/riven" ||
    dep === "@repo/util-rank-torrent-name",
);
