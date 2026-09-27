import {
  MediaItem,
  Movie,
  Show,
  MediaEntry,
} from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
import { TopLevelMediaItemType } from "@repo/util-plugin-sdk/dto/enums/top-level-media-item-type.enum";
import { MediaMetadata } from "@repo/util-plugin-sdk/dto/types/media-metadata.type";

import {
  Arg,
  Field,
  Float,
  ID,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";

@ObjectType()
class Genre {
  @Field(() => ID)
  public id!: string;

  @Field()
  public name!: string;
}

@ObjectType()
class CastMember {
  @Field(() => ID)
  public id!: string;

  @Field()
  public name!: string;

  @Field()
  public character!: string;

  @Field({ nullable: true })
  public profilePath?: string;
}

@ObjectType()
class InstanceStatus {
  @Field()
  public setupRequired!: boolean;
}

@ObjectType()
class AuthProvider {
  @Field()
  public disableSignup!: boolean;

  @Field()
  public enabled!: boolean;

  @Field({ nullable: true })
  public icon?: string;

  @Field()
  public key!: string;

  @Field({ nullable: true })
  public name?: string;
}

@ObjectType()
class Trailer {
  @Field(() => ID)
  public id!: string;

  @Field()
  public name!: string;

  @Field()
  public site!: string;

  @Field()
  public key!: string;

  @Field()
  public url!: string;
}

@ObjectType()
class SeasonData {
  @Field(() => ID)
  public id!: string;

  @Field()
  public name!: string;

  @Field()
  public seasonNumber!: number;

  @Field()
  public episodeCount!: number;

  @Field()
  public completedCount!: number;

  @Field({ nullable: true })
  public image?: string;
}

@ObjectType()
class MediaDetailsDetails {
  @Field(() => ID)
  public id!: string;

  @Field()
  public backdropPath!: string;

  @Field({ nullable: true })
  public logo?: string;

  @Field(() => Trailer)
  public trailer!: Trailer;

  @Field()
  public title!: string;

  @Field()
  public posterPath!: string;

  @Field()
  public overview!: string;

  @Field(() => [MediaItem])
  public recommendations!: MediaItem[];

  @Field(() => [MediaItem])
  public similar!: MediaItem[];

  @Field(() => [Genre])
  public genres!: Genre[];

  @Field(() => [CastMember])
  public cast!: CastMember[];

  @Field()
  public year!: number;

  @Field()
  public formattedRuntime!: string;

  @Field()
  public originalLanguage!: string;

  @Field()
  public certification!: string;

  @Field()
  public status!: string;

  @Field(() => [SeasonData], { nullable: true })
  public seasons?: SeasonData[];
}

@ObjectType()
class MediaDetails {
  @Field()
  public totalFileCount!: number;

  @Field()
  public completedFileCount!: number;

  @Field(() => MediaDetailsDetails)
  public details!: MediaDetailsDetails;

  @Field(() => MediaItemType.enum)
  public type!: MediaItemType;

  @Field(() => MediaItemState.enum)
  public state!: MediaItemState;

  @Field(() => [MediaEntry])
  public filesystemEntries!: MediaEntry[];

  @Field(() => MediaMetadata, { nullable: true })
  public mediaMetadata?: MediaMetadata;
}

@ObjectType()
class Rating {
  @Field()
  public name!: string;

  @Field()
  public image!: string;

  @Field()
  public score!: string;

  @Field()
  public url!: string;
}

@ObjectType()
class NowPlayingItem {
  @Field(() => ID)
  public id!: string;

  @Field()
  public title!: string;

  @Field(() => TopLevelMediaItemType.enum)
  public mediaType!: TopLevelMediaItemType;

  @Field()
  public backdropPath!: string;

  @Field()
  public certification!: string;

  @Field()
  public originalLanguage!: string;

  @Field()
  public overview!: string;

  @Field(() => Date)
  public releaseDate!: Date;

  @Field(() => [Rating])
  public ratings!: Rating[];

  @Field()
  public logo!: string;

  @Field(() => [Genre])
  public genres!: Genre[];

  @Field(() => Float)
  public voteAverage!: number;
}

@Resolver()
export class _TempFrontendResolver {
  @Query(() => [MediaItem])
  public recentlyAdded() {
    return [];
  }

  @Query(() => [NowPlayingItem])
  public nowPlaying() {
    return [];
  }

  @Query(() => [Movie])
  public trendingMovies(@Arg("timeWindow", () => String) _timeWindow: string) {
    return [];
  }

  @Query(() => [Show])
  public trendingShows(@Arg("timeWindow", () => String) _timeWindow: string) {
    return [];
  }

  @Query(() => MediaDetails)
  public mediaDetails(@Arg("id", () => ID) _id: string) {
    return {};
  }

  @Query(() => [MediaItem])
  public discoveryItems() {
    return [];
  }

  @Query(() => [AuthProvider])
  public authProviders() {
    return [];
  }

  @Query(() => InstanceStatus)
  public instanceStatus() {
    return {};
  }
}
