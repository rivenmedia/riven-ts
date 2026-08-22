import { defineConfig, defineDocs } from "fumadocs-mdx/config";

import { workspaceImports } from "./workspace-imports";

interface WorkspaceConfig {
  config: Record<string, unknown>;
  dir: string;
}

const workspacePromises = await Promise.allSettled(
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

const workspaces = workspacePromises.flatMap((result) =>
  result.status === "fulfilled" ? [result.value] : [],
);

export const docs = defineDocs({});

export default defineConfig({
  workspaces: Object.fromEntries(workspaces),
});
