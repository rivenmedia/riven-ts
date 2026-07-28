import { describe, expect, it } from "vitest";

import { PathInfo } from "./path-info.schema.ts";
import { resolveVfsPath } from "./vfs-path.schema.ts";

import type { SectionDescriptor } from "../../library-section/section-registry.ts";

const buildSection = (
  overrides: Partial<SectionDescriptor> & Pick<SectionDescriptor, "slug">,
): SectionDescriptor => ({
  id: `00000000-0000-0000-0000-00000000000${String(overrides.slug.length % 10)}`,
  mediaTypes: ["movie", "show"],
  split: true,
  enabled: true,
  sortOrder: 0,
  rule: null,
  include: new Set(),
  exclude: new Set(),
  ...overrides,
});

const sectionMap = (...sections: SectionDescriptor[]) =>
  new Map(sections.map((section) => [section.slug, section]));

const horror = buildSection({ slug: "horror" });
const animeMovies = buildSection({
  slug: "anime-movies",
  mediaTypes: ["movie"],
});
const flatMixed = buildSection({ slug: "flat", split: false });
const disabled = buildSection({ slug: "disabled", enabled: false });

const sections = sectionMap(horror, animeMovies, flatMixed, disabled);

const MOVIE = "Alien (1979) {tmdb-348}";
const SHOW = "Fringe (2008) {tvdb-82066}";

describe("built-in roots", () => {
  it("resolves the filesystem root", () => {
    expect(resolveVfsPath("/", sections)).toStrictEqual({ kind: "root" });
  });

  it.each([
    ["/movies"],
    ["/shows"],
    [`/movies/${MOVIE}`],
    [`/movies/${MOVIE}/${MOVIE}.mkv`],
    [`/shows/${SHOW}`],
    [`/shows/${SHOW}/Season 01`],
    [`/shows/${SHOW}/Season 01/${SHOW} - s01e01.mkv`],
    [`/shows/${SHOW}/Season 01/${SHOW} - s01e01.en.srt`],
  ])("leaves %s exactly as the unprefixed parser would read it", (rawPath) => {
    const resolved = resolveVfsPath(rawPath, sections);

    // The regression guarantee: built-in paths must resolve to precisely
    // what PathInfo produced before sections existed, and carry no section.
    expect(resolved).toStrictEqual({
      kind: "media",
      section: null,
      pathInfo: PathInfo.parse(rawPath),
    });
  });

  it("rejects a path that merely starts with a root name", () => {
    expect(resolveVfsPath("/moviesXYZ", sections)).toBeNull();
  });
});

describe("split sections", () => {
  it("resolves the section root to its own kind", () => {
    expect(resolveVfsPath("/horror", sections)).toStrictEqual({
      kind: "section-root",
      section: horror,
    });
  });

  it.each([
    ["/horror/movies", "all-movies"],
    [`/horror/movies/${MOVIE}`, "single-movie"],
    [`/horror/movies/${MOVIE}/${MOVIE}.mkv`, "single-movie"],
    ["/horror/shows", "all-shows"],
    [`/horror/shows/${SHOW}`, "show-seasons"],
    [`/horror/shows/${SHOW}/Season 01`, "season-episodes"],
    [`/horror/shows/${SHOW}/Season 01/${SHOW} - s01e01.mkv`, "single-episode"],
  ])("resolves %s as %s", (rawPath, expectedType) => {
    const resolved = resolveVfsPath(rawPath, sections);

    expect(resolved?.kind).toBe("media");
    expect(resolved).toMatchObject({
      section: horror,
      pathInfo: { pathType: expectedType },
    });
  });

  it("normalises a section path onto its built-in equivalent", () => {
    const viaSection = resolveVfsPath(`/horror/movies/${MOVIE}`, sections);
    const viaRoot = resolveVfsPath(`/movies/${MOVIE}`, sections);

    expect(viaSection).toMatchObject({
      pathInfo: { rawPath: `/movies/${MOVIE}` },
    });
    expect(
      viaSection?.kind === "media" ? viaSection.pathInfo : null,
    ).toStrictEqual(viaRoot?.kind === "media" ? viaRoot.pathInfo : undefined);
  });
});

describe("flat sections", () => {
  it("resolves the section root to its own kind", () => {
    // A flat section may hold both media types, so its root merges two
    // listings and cannot be described by a single PathInfo.
    expect(resolveVfsPath("/anime-movies", sections)).toStrictEqual({
      kind: "section-flat-root",
      section: animeMovies,
    });
  });

  it("resolves a flat mixed section root to its own kind too", () => {
    expect(resolveVfsPath("/flat", sections)).toStrictEqual({
      kind: "section-flat-root",
      section: flatMixed,
    });
  });

  it("resolves an item directly under the section", () => {
    expect(resolveVfsPath(`/anime-movies/${MOVIE}`, sections)).toMatchObject({
      kind: "media",
      pathInfo: { pathType: "single-movie", tmdbId: "348" },
    });
  });

  it("disambiguates movies from shows by their provider token", () => {
    expect(resolveVfsPath(`/flat/${MOVIE}`, sections)).toMatchObject({
      pathInfo: { type: "movies", pathType: "single-movie" },
    });
    expect(resolveVfsPath(`/flat/${SHOW}`, sections)).toMatchObject({
      pathInfo: { type: "shows", pathType: "show-seasons" },
    });
  });

  it("resolves a nested episode inside a flat section", () => {
    expect(
      resolveVfsPath(`/flat/${SHOW}/Season 01/${SHOW} - s01e01.mkv`, sections),
    ).toMatchObject({
      pathInfo: { pathType: "single-episode", season: 1, episode: 1 },
    });
  });

  it("rejects an entry carrying no provider token", () => {
    expect(resolveVfsPath("/flat/Not An Item", sections)).toBeNull();
  });
});

describe("rejections", () => {
  it.each([
    ["an unknown section", "/nope"],
    ["a path inside an unknown section", "/nope/movies"],
    ["a disabled section", "/disabled"],
    ["a path inside a disabled section", `/disabled/movies/${MOVIE}`],
    ["a namespace the section does not hold", "/anime-movies/shows"],
    ["a show inside a movies-only section", `/anime-movies/${SHOW}`],
  ])("rejects %s", (_label, rawPath) => {
    expect(resolveVfsPath(rawPath, sections)).toBeNull();
  });

  it("resolves nothing when no sections are configured", () => {
    const empty = new Map<string, SectionDescriptor>();

    expect(resolveVfsPath("/horror", empty)).toBeNull();
    expect(resolveVfsPath("/movies", empty)).not.toBeNull();
  });
});
