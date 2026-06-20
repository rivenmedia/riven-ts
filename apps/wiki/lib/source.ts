import { workspaceImports } from "@/lib/workspace-imports";
import { docs } from "collections/server";
import { type PageData, loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";

import type { DocsCollectionEntry } from "fumadocs-mdx/runtime/server";

type WorkspaceEntry = DocsCollectionEntry<
  string,
  PageData & { full?: boolean }
>;

const workspaces = await Promise.all(
  workspaceImports.map(async (workspace) => {
    const { docs } = (await import(`../.source/${workspace}/server`)) as {
      docs: WorkspaceEntry;
    };

    return [workspace, docs.toFumadocsSource()];
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
