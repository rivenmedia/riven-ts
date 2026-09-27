import { excludedWorkspaces } from "@/excluded-workspaces";

import { docs } from "collections/server";
import { loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";

import packageJson from "../package.json" with { type: "json" };

import type { PageData } from "fumadocs-core/source";
import type { DocsCollectionEntry } from "fumadocs-mdx/runtime/server";

type WorkspaceEntry = DocsCollectionEntry<
  string,
  PageData & { full?: boolean }
>;

/**
 * Every workspace that contributes docs, derived from this package's own
 * dependencies so adding a plugin needs no change here — the plugin generator
 * already adds itself as a dependency of `@repo/wiki`.
 */
const workspaceImports = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
}).filter(
  (dependency) =>
    dependency.startsWith("@repo/") && !excludedWorkspaces.has(dependency),
);

const workspaces = await Promise.all(
  workspaceImports.map(async (workspace) => {
    const { docs: workspaceDocs } = (await import(
      `../.source/${workspace}/server`
    )) as {
      docs: WorkspaceEntry;
    };

    return [workspace, workspaceDocs.toFumadocsSource()];
  }),
);

export const source = loader(
  {
    root: docs.toFumadocsSource(),
    ...(Object.fromEntries(workspaces) as Record<
      string,
      ReturnType<WorkspaceEntry["toFumadocsSource"]>
    >),
  },
  {
    baseUrl: "/docs",
    plugins: [lucideIconsPlugin()],
  },
);
