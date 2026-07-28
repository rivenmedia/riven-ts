import {
  Entity,
  Enum,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from "@mikro-orm/decorators/legacy";
import { randomUUID } from "node:crypto";
import { Field, ID, ObjectType } from "type-graphql";

import { DateTime } from "../../../helpers/dates.ts";
import { LibrarySectionOverrideMode } from "../../enums/library-section-override-mode.enum.ts";
import { MediaItem } from "../media-items/media-item.entity.ts";
import { LibrarySection } from "./library-section.entity.ts";

import type { Opt, Ref } from "@mikro-orm/core";

/**
 * A manual decision that beats a section's rule for one media item.
 *
 * Modelled as a single table with a mode column rather than two many-to-many
 * relations so that the unique index makes "included and excluded at the same
 * time" structurally impossible. With two join tables that invariant would have
 * to be checked in application code on every write, and would eventually drift.
 */
@ObjectType()
@Entity()
@Unique({ properties: ["section", "mediaItem"] })
export class LibrarySectionOverride {
  @Field(() => ID)
  @PrimaryKey({ type: "uuid" })
  public id = randomUUID();

  @ManyToOne(() => LibrarySection, { deleteRule: "cascade" })
  public section!: Ref<LibrarySection>;

  // Items are hard-deleted by the reset flows, and a dangling override would
  // break the membership build, so this cascades too.
  @Field(() => MediaItem)
  @ManyToOne(() => MediaItem, { deleteRule: "cascade" })
  public mediaItem!: Ref<MediaItem>;

  @Field(() => LibrarySectionOverrideMode.enum)
  @Enum(() => LibrarySectionOverrideMode.enum)
  public mode!: LibrarySectionOverrideMode;

  @Field(() => Date)
  @Property()
  public createdAt: Opt<Date> = DateTime.utc().toJSDate();
}
