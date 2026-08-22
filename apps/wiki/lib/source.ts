import { workspaceImports } from "@/workspace-imports";

import { docs } from "collections/server";
import { loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";

import type { PageData } from "fumadocs-core/source";
import type { DocsCollectionEntry } from "fumadocs-mdx/runtime/server";

type WorkspaceEntry = DocsCollectionEntry<
  string,
  PageData & { full?: boolean }
>;

const workspacePromises = await Promise.allSettled(
  workspaceImports.map(async (workspace) => {
    const { docs: workspaceDocs } = (await import(
      `../.source/${workspace}/server`
    )) as {
      docs: WorkspaceEntry;
    };

    return [workspace, workspaceDocs.toFumadocsSource()];
  }),
);

console.log(
  workspacePromises.filter(
    (result) =>
      result.status === "rejected" && result.reason.code !== "MODULE_NOT_FOUND",
  ),
);

const workspaces = workspacePromises.flatMap((result) =>
  result.status === "fulfilled" ? [result.value] : [],
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
