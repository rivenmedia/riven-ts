import Fuse from "@zkochan/fuse-native";

import { FuseError } from "../../../../vfs/errors/fuse-error.ts";
import {
  librarySectionRegistry,
  membershipIncludesEntryName,
} from "../../library-section/section-registry.ts";
import { PathInfo } from "../schemas/path-info.schema.ts";
import {
  NAMESPACE_BY_MEDIA_TYPE,
  PersistentDirectory,
} from "../schemas/persistent-directory.schema.ts";
import { resolveVfsPath } from "../schemas/vfs-path.schema.ts";
import { getMoviesDirectoryEntries } from "./get-movies-directory-entries.ts";
import { getShowsDirectoryEntries } from "./get-shows-directory-entries.ts";

import type { EntityManager } from "@mikro-orm/core";

/**
 * The unfiltered listing for a path below a namespace.
 *
 * Shared by the built-in roots and by sections, so a section can never produce
 * an entry name that differs from the one `/movies` or `/shows` would.
 */
async function getNamespaceEntries(em: EntityManager, pathInfo: PathInfo) {
  switch (pathInfo.pathType) {
    case "all-movies":
    case "single-movie": {
      return getMoviesDirectoryEntries(em, pathInfo);
    }
    case "all-shows":
    case "show-seasons":
    case "season-episodes": {
      return getShowsDirectoryEntries(em, pathInfo);
    }
    case "single-episode":
    case "subtitle-file": {
      return [pathInfo.base];
    }
  }
}

export async function getVfsDirectoryEntryPaths(
  em: EntityManager,
  rawPath: string,
) {
  const sections = await librarySectionRegistry.snapshot(em);
  const resolved = resolveVfsPath(rawPath, sections);

  if (!resolved) {
    throw new FuseError(Fuse.ENOENT, "Unable to parse path info");
  }

  switch (resolved.kind) {
    case "root": {
      const enabled = await librarySectionRegistry.enabledSections(em);

      return [
        ...PersistentDirectory.options,
        ...enabled.map((section) => section.slug),
      ];
    }

    case "section-root": {
      return resolved.section.mediaTypes.map(
        (mediaType) => NAMESPACE_BY_MEDIA_TYPE[mediaType],
      );
    }

    case "section-flat-root": {
      const { section } = resolved;
      const membership = await librarySectionRegistry.membershipFor(
        em,
        section.id,
      );

      const listings = await Promise.all(
        section.mediaTypes.map(async (mediaType) =>
          getNamespaceEntries(
            em,
            PathInfo.parse(`/${NAMESPACE_BY_MEDIA_TYPE[mediaType]}`),
          ),
        ),
      );

      return listings
        .flat()
        .filter((entry) => membershipIncludesEntryName(membership, entry));
    }

    case "media": {
      const { section, pathInfo } = resolved;
      const entries = await getNamespaceEntries(em, pathInfo);

      // Only the top level of a namespace is filtered. An item belongs to a
      // section as a whole, so once it is a member its seasons, episodes and
      // subtitles come with it.
      if (
        !section ||
        (pathInfo.pathType !== "all-movies" &&
          pathInfo.pathType !== "all-shows")
      ) {
        return entries;
      }

      const membership = await librarySectionRegistry.membershipFor(
        em,
        section.id,
      );

      return entries.filter((entry) =>
        membershipIncludesEntryName(membership, entry),
      );
    }
  }
}
