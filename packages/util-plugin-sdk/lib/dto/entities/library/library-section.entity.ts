import { Collection } from "@mikro-orm/core";
import {
  Entity,
  Index,
  OneToMany,
  PrimaryKey,
  Property,
  Unique,
} from "@mikro-orm/decorators/legacy";
import { ArrayNotEmpty, Matches, MaxLength, MinLength } from "class-validator";
import { JSONObjectResolver } from "graphql-scalars";
import { randomUUID } from "node:crypto";
import { Field, ID, Int, ObjectType } from "type-graphql";

import { DateTime } from "../../../helpers/dates.ts";
import { MediaItemType } from "../../enums/media-item-type.enum.ts";
import { LibrarySectionOverride } from "./library-section-override.entity.ts";

import type { LibrarySectionRule } from "../../../schemas/library-section/index.ts";
import type { Opt } from "@mikro-orm/core";

/** The media item types a section may be built from. */
export type LibrarySectionMediaType = Extract<MediaItemType, "movie" | "show">;

/**
 * The permitted shape of a section's directory name.
 *
 * The slug is load-bearing: it becomes a top-level VFS directory and is the
 * first segment the path resolver matches against. The restrictions exist
 * because of how the rest of the filesystem parses paths:
 *
 * - No `.`, or `path.parse` reads the trailing segment as a file extension and
 *   the directory is mistaken for a file. This is the same reason
 *   `FileSystemEntry._setPath` strips periods from generated directory names.
 * - No `/`, which would create a directory level the resolver cannot attribute
 *   to either a section or a media item.
 * - No leading `.`, which `isHiddenPath` would reject before the resolver ever
 *   sees it.
 * - Lowercase only. FUSE is case-sensitive, but macOS and SMB re-exports are
 *   not, so `Horror` and `horror` must not both exist.
 *
 * `movies` and `shows` are additionally reserved, and rejected by the service
 * rather than here, so the user gets a useful message.
 */
export const LIBRARY_SECTION_SLUG_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u;

export const LIBRARY_SECTION_MAX_SLUG_LENGTH = 64;

/** The layout of a section, as a pure function of its shape. */
export interface LibrarySectionLayout {
  slug: string;
  split: boolean;
  mediaTypes: LibrarySectionMediaType[];
}

/**
 * The single source of truth for a section's on-disk layout.
 *
 * Shared by the entity, the VFS path resolver and the media-server refresh
 * hooks so the three can never disagree about where an item lives.
 */
export function librarySectionDirectoryFor(
  { slug, split, mediaTypes }: LibrarySectionLayout,
  mediaType: LibrarySectionMediaType,
): string | null {
  if (!mediaTypes.includes(mediaType)) {
    return null;
  }

  // A subdirectory would be the section root's only child, so it is collapsed.
  if (!split || mediaTypes.length === 1) {
    return slug;
  }

  return `${slug}/${mediaType === "movie" ? "movies" : "shows"}`;
}

@ObjectType()
@Entity()
export class LibrarySection {
  @Field(() => ID)
  @PrimaryKey({ type: "uuid" })
  public id = randomUUID();

  /** Free-form display name, shown in the UI rather than the filesystem. */
  @Field(() => String)
  @Property()
  @MinLength(1)
  @MaxLength(120)
  public name!: string;

  /** The top-level VFS directory name. See {@link LIBRARY_SECTION_SLUG_PATTERN}. */
  @Field(() => String)
  @Property({ type: "varchar", length: LIBRARY_SECTION_MAX_SLUG_LENGTH })
  @Unique()
  @Index()
  @Matches(LIBRARY_SECTION_SLUG_PATTERN)
  public slug!: string;

  /** Which media item types this section may contain. */
  @Field(() => [MediaItemType.enum])
  @Property({ type: "json" })
  @ArrayNotEmpty()
  public mediaTypes!: LibrarySectionMediaType[];

  /**
   * Whether to nest contents under `movies/` and `shows/` subdirectories.
   *
   * Ignored when the section holds a single media type, since the subdirectory
   * would be the only child of the section root.
   */
  @Field(() => Boolean)
  @Property({ default: true })
  public split: Opt<boolean> = true;

  /**
   * The filter tree deciding membership, or `null` to accept everything of the
   * permitted media types.
   *
   * Validated against `LibrarySectionRuleRoot` on write. Stored as jsonb rather
   * than a normalised structure because it is read as a whole, never queried
   * into.
   */
  @Field(() => JSONObjectResolver, { nullable: true })
  @Property({ type: "json", nullable: true })
  public rule?: LibrarySectionRule | null;

  /** Hides the section from the VFS without discarding its configuration. */
  @Field(() => Boolean)
  @Property({ default: true })
  public enabled: Opt<boolean> = true;

  /** Ascending order in the root directory listing. Ties broken by slug. */
  @Field(() => Int)
  @Property({ default: 0 })
  public sortOrder: Opt<number> = 0;

  @Field(() => [LibrarySectionOverride])
  @OneToMany(() => LibrarySectionOverride, (override) => override.section, {
    orphanRemoval: true,
  })
  public overrides = new Collection<LibrarySectionOverride>(this);

  @Field(() => Date)
  @Property()
  public createdAt: Opt<Date> = DateTime.utc().toJSDate();

  @Field(() => Date, { nullable: true })
  @Property({ onUpdate: () => DateTime.utc().toJSDate() })
  public updatedAt?: Opt<Date> | null;

  /**
   * The directory a given media type lives in, or `null` if the section does
   * not hold that type.
   *
   * @example getVfsDirectoryFor("movie") === "horror/movies"
   * @example getVfsDirectoryFor("movie") === "anime-movies"
   */
  public getVfsDirectoryFor(mediaType: LibrarySectionMediaType) {
    return librarySectionDirectoryFor(this, mediaType);
  }

  /**
   * Every directory this section exposes, relative to the VFS root.
   *
   * @example ["horror/movies", "horror/shows"]
   * @example ["anime-movies"]
   */
  public getVfsDirectories(): string[] {
    // A flat section maps both media types onto the same directory, hence the
    // de-duplication.
    return [
      ...new Set(
        this.mediaTypes
          .map((mediaType) => this.getVfsDirectoryFor(mediaType))
          .filter((directory) => directory !== null),
      ),
    ];
  }
}
