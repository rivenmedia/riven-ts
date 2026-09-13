import { source } from "@/lib/source";

import type { Folder, Node } from "fumadocs-core/page-tree";
import type { ReactNode } from "react";

export interface PluginEntry {
  /** Package name without the `@repo/plugin-` prefix, e.g. `stremthru`. */
  name: string;
  /** Display name, from the plugin's `docs/plugins/<name>/meta.json`. */
  title: string;
  description: string | undefined;
  /** Link to the plugin's first documentation page. */
  url: string;
}

/**
 * Extracts the plugin name from a page URL, e.g. `/docs/plugins/seerr/settings`
 * yields `seerr`. Returns `undefined` for anything else, including the
 * `/docs/plugins` overview itself.
 */
function getPluginName(url: string): string | undefined {
  const [, docs, plugins, name, ...rest] = url.split("/");

  if (docs !== "docs" || plugins !== "plugins" || rest.length === 0) {
    return undefined;
  }

  return name;
}

function collectFolders(nodes: Node[]): Folder[] {
  return nodes.flatMap((node) =>
    node.type === "folder" ? [node, ...collectFolders(node.children)] : [],
  );
}

function findFirstPageUrl(folder: Folder): string | undefined {
  if (folder.index) {
    return folder.index.url;
  }

  for (const child of folder.children) {
    if (child.type === "page") {
      return child.url;
    }

    if (child.type === "folder") {
      const url = findFirstPageUrl(child);

      if (url) {
        return url;
      }
    }
  }

  return undefined;
}

/**
 * `name` and `description` are typed as `ReactNode` because a page tree can be
 * built from JSX. Ours always come from `meta.json`, so they're plain strings.
 */
function asText(node: ReactNode): string | undefined {
  return typeof node === "string" ? node : undefined;
}

/**
 * The list of documented plugins, derived from the page tree.
 *
 * Every plugin package contributes its own `docs/plugins/<name>/` directory
 * (see `buildWikiConfig`), so this stays in sync automatically — adding or
 * removing a plugin needs no changes here.
 */
export function getPlugins(): PluginEntry[] {
  // A plugin may nest further folders under its own directory, which would
  // match too. Keep the shallowest match per plugin — that's the plugin folder
  // itself, and the one carrying the display name.
  const byName = new Map<string, PluginEntry>();

  for (const folder of collectFolders(source.pageTree.children)) {
    const url = findFirstPageUrl(folder);
    const name = url && getPluginName(url);

    if (!url || !name) {
      continue;
    }

    const existing = byName.get(name);

    if (existing && existing.url.length <= url.length) {
      continue;
    }

    byName.set(name, {
      name,
      title: asText(folder.name) ?? name,
      description: asText(folder.description),
      url,
    });
  }

  return [...byName.values()].toSorted((a, b) =>
    a.title.localeCompare(b.title),
  );
}
