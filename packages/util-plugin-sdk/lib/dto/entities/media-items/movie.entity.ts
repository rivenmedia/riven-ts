import { EntityRepositoryType } from "@mikro-orm/core";
import { Entity, Property } from "@mikro-orm/decorators/legacy";
import { IsNumberString } from "class-validator";
import { Field, Int, ObjectType } from "type-graphql";

import { MovieContentRatingEnum } from "../../enums/content-ratings.enum.ts";
import { MovieRepository } from "../../repositories/movie.repository.ts";
import { MediaItem } from "./index.ts";

import type { MovieContentRating } from "../../enums/content-ratings.enum.ts";
import type { MediaEntry } from "../filesystem/index.ts";
import type { Opt } from "@mikro-orm/core";

@ObjectType({ implements: MediaItem })
@Entity({ repository: () => MovieRepository })
export class Movie extends MediaItem {
  public [EntityRepositoryType]?: MovieRepository;

  @Field(() => Int, { nullable: true })
  @Property()
  public runtime!: number | null;

  @Field(() => MovieContentRatingEnum)
  declare public contentRating: MovieContentRating;

  public override type: Opt<"movie"> = "movie" as const;

  @Field(() => String)
  @Property({ type: "varchar", length: 10 })
  @IsNumberString()
  public tmdbId!: string;

  public async getMediaEntries() {
    return this.filesystemEntries.matching<MediaEntry>({
      where: {
        type: "media",
      },
    });
  }

  public getPrettyName(): string {
    return `${this.title.replaceAll(".", "")} (${this.year?.toString() ?? "Unknown"}) {tmdb-${this.tmdbId}}`;
  }

  public getExpectedFileCount(): number {
    return 1;
  }

  public getIncompleteItems() {
    return [];
  }
}
