import {
  BeforeCreate,
  Collection,
  Entity,
  type EventArgs,
  type Hidden,
  ManyToOne,
  OneToMany,
  type Opt,
  Property,
  type Ref,
} from "@mikro-orm/core";
import { Min } from "class-validator";
import { Field, ObjectType } from "type-graphql";

import { MediaEntry } from "../filesystem/media-entry.entity.ts";
import { Episode } from "./episode.entity.ts";
import { ShowLikeMediaItem } from "./show-like.entity.ts";
import { Show } from "./show.entity.ts";

@ObjectType()
@Entity()
export class Season extends ShowLikeMediaItem {
  declare filesystemEntries: never;

  @Field()
  @Property()
  @Min(0)
  number!: number;

  @Field(() => Show)
  @ManyToOne()
  show!: Opt<Ref<Show>>;

  @Field(() => [Episode])
  @OneToMany(() => Episode, (episode) => episode.season)
  episodes = new Collection<Episode>(this);

  @Property({ persist: false, hidden: true, getter: true })
  get prettyName(): Opt<Hidden<string>> {
    return `Season ${this.number.toString().padStart(2, "0")}`;
  }

  @Property()
  isSpecial!: boolean;

  @Property()
  isRequested!: boolean;

  override type: Opt<"season"> = "season" as const;

  declare tvdbId: Opt<string>;
  declare tmdbId?: never;
  declare contentRating: Opt<never>;

  getShow() {
    return this.show.loadOrFail();
  }

  async getMediaEntries() {
    const episodes = await this.episodes.matching({
      where: {
        filesystemEntries: {
          $some: {
            type: "media",
          },
        },
      },
      populate: ["filesystemEntries"],
      refresh: true,
    });

    return episodes.flatMap<MediaEntry>(
      (episode) =>
        episode.filesystemEntries.filter(
          (entry) => entry.type === "media",
        ) as MediaEntry[],
    );
  }

  @BeforeCreate()
  _fallbackToShowExternalIds() {
    this.tvdbId ||= this.show.getProperty("tvdbId");
    this.imdbId ??= this.show.getProperty("imdbId") ?? null;
  }

  @BeforeCreate()
  _copyItemRequest() {
    this.itemRequest = this.show.getProperty("itemRequest");

    const requestedSeasons = this.itemRequest.getProperty("seasons");

    /**
     * If the item request has specific seasons requested, only mark this season as requested if it's included in that list.
     *
     * Otherwise, request all non-special seasons. This is the default behaviour of list ingestion.
     */
    this.isRequested = requestedSeasons
      ? requestedSeasons.includes(this.number)
      : this.number > 0;
  }

  @BeforeCreate()
  _persistFullTitle({ entity }: EventArgs<this>) {
    this.fullTitle = `${entity.show.getProperty("fullTitle")} - S${entity.number.toString().padStart(2, "0")}`;
  }
}
