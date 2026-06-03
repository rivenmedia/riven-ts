import { defineConfig, defineDocs } from "fumadocs-mdx/config";

import packageJson from "./package.json" with { type: "json" };

const workspaceImports = Object.keys(packageJson.devDependencies).filter(
  (dep) =>
    dep.startsWith("@repo/plugin-") ||
    dep === "@repo/riven" ||
    dep === "@repo/util-rank-torrent-name",
);

interface WorkspaceConfig {
  config: Record<string, unknown>;
  dir: string;
}

const workspaces = await Promise.all(
  workspaceImports.map<Promise<[string, WorkspaceConfig]>>(
    async (workspace) => {
      const { dir, ...config } = (await import(`${workspace}/wiki.config`)) as {
        default: Record<string, unknown>;
        dir: string;
      };

      return [
        workspace,
        {
          config,
          dir,
        },
      ];
    },
  ),
);

export const docs = defineDocs({});

export default defineConfig({
  workspaces: Object.fromEntries(workspaces),
});
