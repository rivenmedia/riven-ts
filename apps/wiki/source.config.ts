import { defineConfig, defineDocs } from "fumadocs-mdx/config";

import { excludedWorkspaces } from "./excluded-workspaces";
import packageJson from "./package.json" with { type: "json" };

const workspaceImports = Object.keys(packageJson.devDependencies).filter(
  (dependency) =>
    dependency.startsWith("@repo/") && !excludedWorkspaces.has(dependency),
);

interface WorkspaceConfig {
  config: Record<string, unknown>;
  dir: string;
}

const workspaces = await Promise.all(
  workspaceImports.map<Promise<[string, WorkspaceConfig]>>(
    async (workspace) => {
      try {
        const { dir, ...config } = (await import(
          `${workspace}/wiki.config`
        )) as {
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
      } catch (error) {
        // oxlint-disable-next-line no-console
        console.error(`Failed to load wiki.config for workspace: ${workspace}`);

        throw error;
      }
    },
  ),
);

export const docs = defineDocs({});

export default defineConfig({
  workspaces: Object.fromEntries(workspaces),
});
