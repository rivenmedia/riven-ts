import { defineConfig, defineDocs } from "fumadocs-mdx/config";

import { workspaceImports } from "./lib/workspace-imports.ts";

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
