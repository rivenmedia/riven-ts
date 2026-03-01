import {
  BeforeCreate,
  Collection,
  Entity,
  Enum,
  type EventArgs,
  type Hidden,
  OneToMany,
  type Opt,
  Property,
  type Ref,
} from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

import {
  ShowContentRating,
  ShowContentRatingEnum,
} from "../../enums/content-ratings.enum.ts";
import { ShowStatus } from "../../enums/show-status.enum.ts";
import { MediaEntry } from "../filesystem/media-entry.entity.js";
import { Season } from "./season.entity.ts";
import { ShowLikeMediaItem } from "./show-like.entity.ts";

import type { ItemRequest } from "../requests/item-request.entity.ts";

@ObjectType()
@Entity()
export class Show extends ShowLikeMediaItem {
  @Field(() => ShowContentRatingEnum)
  declare contentRating: ShowContentRating;

  override type: Opt<"show"> = "show" as const;

  declare tvdbId: string;
  declare tmdbId?: never;
  declare itemRequest: Ref<ItemRequest>;
  declare filesystemEntries: never;

  @Field(() => ShowStatus.enum, { nullable: true })
  @Enum(() => ShowStatus.enum)
  status!: ShowStatus;

  @Field(() => String)
  @Property({ type: "json" })
  releaseData: object = {};

  @Field(() => [Season], { nullable: true })
  @OneToMany(() => Season, (season) => season.show)
  seasons = new Collection<Season>(this);

  async getEpisodes() {
    const seasons = await this.seasons.loadItems({
      populate: ["episodes"],
    });

    return seasons.flatMap((season) => season.episodes.getItems());
  }

  async getMediaEntries() {
    const seasons = await this.seasons.loadItems({
      where: {
        episodes: {
          filesystemEntries: {
            $some: {
              type: "media",
            },
          },
        },
      },
      fields: ["episodes"],
      populate: ["episodes.filesystemEntries"],
      refresh: true,
    });

    const episodes = seasons.flatMap((season) => season.episodes.getItems());

    return episodes.flatMap(
      (episode) =>
        episode.filesystemEntries.filter(
          (entry) => entry.type === "media",
        ) as MediaEntry[],
    );
  }

  @Property({ persist: false, hidden: true, getter: true })
  get prettyName(): Opt<Hidden<string>> {
    return `${this.title} (${this.year?.toString() ?? "Unknown"}) {tvdb-${this.tvdbId}}`;
  }

  getShow() {
    return this;
  }

  @BeforeCreate()
  _persistFullTitle({ entity }: EventArgs<this>) {
    this.fullTitle = entity.title;
  }
}
