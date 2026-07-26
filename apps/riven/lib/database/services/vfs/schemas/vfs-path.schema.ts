import path from "node:path";

import { PathInfo, parseProviderToken } from "./path-info.schema.ts";
import {
  MEDIA_TYPE_BY_NAMESPACE,
  PersistentDirectory,
} from "./persistent-directory.schema.ts";

import type { SectionDescriptor } from "../../library-section/section-registry.ts";

/**
 * A resolved VFS path.
 *
 * `section` is `null` for the built-in `/movies` and `/shows` trees, which are
 * unfiltered and behave exactly as they did before sections existed.
 */
export type ResolvedVfsPath =
  | { kind: "root" }
  /** A split section's own directory, listing its `movies` and `shows` children. */
  | { kind: "section-root"; section: SectionDescriptor }
  /**
   * A flat section's own directory. Distinct from `media` because it may hold
   * both media types, so it merges two namespace listings and cannot be
   * described by a single `PathInfo`.
   */
  | { kind: "section-flat-root"; section: SectionDescriptor }
  /** Anything addressable below a namespace, whether built-in or in a section. */
  | {
      kind: "media";
      section: SectionDescriptor | null;
      /**
       * The path with any section prefix rewritten away, so it is always a
       * well-formed built-in path.
       */
      pathInfo: PathInfo;
    };

/**
 * Infers the namespace for an entry inside a flat section, which has no
 * `movies`/`shows` segment to read it from.
 *
 * Episode files carry `{tvdb-N}` as well as show directories, so this stays
 * unambiguous at every depth — which is what makes a flat section holding both
 * media types safe.
 */
const inferNamespace = (segment: string) => {
  const { tmdbId, tvdbId } = parseProviderToken(segment);

  if (tmdbId !== undefined) {
    return PersistentDirectory.enum.movies;
  }

  return tvdbId === undefined ? undefined : PersistentDirectory.enum.shows;
};

/**
 * Resolves a raw VFS path against the section registry.
 *
 * Section paths are isomorphic to built-in paths once the section prefix is
 * removed — `/horror/movies/Alien (1979) {tmdb-348}` is a `/movies` path with a
 * prefix. So rather than teaching the path grammar about sections, this
 * normalises the prefix away and hands the remainder to the unchanged
 * `PathInfo`. Everything downstream keeps working on built-in paths, and
 * section membership only decides *visibility*, never which row a path names.
 *
 * @returns `null` when the path cannot be resolved, which callers turn into ENOENT.
 */
export const resolveVfsPath = (
  rawPath: string,
  sections: ReadonlyMap<string, SectionDescriptor>,
): ResolvedVfsPath | null => {
  const [first, ...rest] = rawPath.split("/").filter(Boolean);

  if (first === undefined) {
    return { kind: "root" };
  }

  // Built-in roots bypass the registry entirely, preserving today's behaviour.
  if (PersistentDirectory.safeParse(first).success) {
    const parsed = PathInfo.safeParse(rawPath);

    return parsed.success
      ? { kind: "media", section: null, pathInfo: parsed.data }
      : null;
  }

  const section = sections.get(first);

  if (!section?.enabled) {
    return null;
  }

  const isSplit = section.split && section.mediaTypes.length > 1;

  if (rest.length === 0) {
    return isSplit
      ? { kind: "section-root", section }
      : { kind: "section-flat-root", section };
  }

  const namespace = isSplit ? rest[0] : inferNamespace(rest[0] ?? "");

  if (
    namespace === undefined ||
    !PersistentDirectory.safeParse(namespace).success ||
    !section.mediaTypes.includes(
      MEDIA_TYPE_BY_NAMESPACE[namespace as PersistentDirectory],
    )
  ) {
    return null;
  }

  const remainder = isSplit ? rest.slice(1) : rest;
  const parsed = PathInfo.safeParse(
    path.posix.join("/", namespace, ...remainder),
  );

  return parsed.success
    ? { kind: "media", section, pathInfo: parsed.data }
    : null;
};
