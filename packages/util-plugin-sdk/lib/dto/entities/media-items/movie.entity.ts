import { EntityRepositoryType, type Opt } from "@mikro-orm/core";
import { Entity, Property } from "@mikro-orm/decorators/legacy";
import { IsNumberString } from "class-validator";
import { Field, Int, ObjectType } from "type-graphql";

import {
  MovieContentRating,
  MovieContentRatingEnum,
} from "../../enums/content-ratings.enum.ts";
import { MovieRepository } from "../../repositories/movie.repository.ts";
import { MediaEntry } from "../filesystem/index.ts";
import { MediaItem } from "./index.ts";

@ObjectType({ implements: MediaItem })
@Entity({ repository: () => MovieRepository })
export class Movie extends MediaItem {
  [EntityRepositoryType]?: MovieRepository;

  @Field(() => Int, { nullable: true })
  @Property()
  runtime!: number | null;

  @Field(() => MovieContentRatingEnum)
  declare contentRating: MovieContentRating;

  override type: Opt<"movie"> = "movie" as const;

  @Field(() => String)
  @Property()
  @IsNumberString()
  tmdbId!: string;

  getMediaEntries() {
    return this.filesystemEntries.matching<MediaEntry>({
      where: {
        type: "media",
      },
    });
  }

  getPrettyName(): string {
    return `${this.title.replaceAll(".", "")} (${this.year?.toString() ?? "Unknown"}) {tmdb-${this.tmdbId}}`;
  }

  getExpectedFileCount(): number {
    return 1;
  }
}
