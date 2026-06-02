import { docs } from "collections/server";
import { type PageData, loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";

import type { DocsCollectionEntry } from "fumadocs-mdx/runtime/server";

type WorkspaceEntry = DocsCollectionEntry<
  string,
  PageData & { full?: boolean }
>;

const workspaceImports = [
  "@repo/riven",
  "@repo/plugin-comet",
  "@repo/plugin-jellyfin",
  "@repo/plugin-listrr",
  "@repo/plugin-mdblist",
  "@repo/plugin-notifications",
  "@repo/plugin-plex",
  "@repo/plugin-seerr",
  "@repo/plugin-stremthru",
  "@repo/plugin-subdl",
  "@repo/plugin-tmdb",
  "@repo/plugin-torrentio",
  "@repo/plugin-tvdb",
  "@repo/util-rank-torrent-name",
] as const;

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
      (typeof workspaceImports)[number],
      ReturnType<WorkspaceEntry["toFumadocsSource"]>
    >),
  },
  {
    baseUrl: "/docs",
    plugins: [lucideIconsPlugin()],
  },
);
