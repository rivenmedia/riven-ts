import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import {
  Arg,
  Args,
  ArgsType,
  Ctx,
  Field,
  ID,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
} from "type-graphql";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";

@InputType()
class MovieMediaEntryFilterArgs {
  @Field(() => String)
  tmdbId!: string;
}

@InputType()
class EpisodeMediaEntryFilterArgs {
  @Field(() => String)
  tvdbId!: string;

  @Field(() => Int)
  seasonNumber!: number;

  @Field(() => Int)
  episodeNumber!: number;
}

@ArgsType()
class MediaEntryFilterArgs {
  @Field(() => MovieMediaEntryFilterArgs, { nullable: true })
  movieFilter?: MovieMediaEntryFilterArgs;

  @Field(() => EpisodeMediaEntryFilterArgs, { nullable: true })
  episodeFilter?: EpisodeMediaEntryFilterArgs;
}

@Resolver((_of) => MediaEntry)
export class MediaEntryResolver {
  @Query(() => [MediaEntry])
  mediaEntries(
    @Ctx() { em }: ApolloServerContext,
    @Args(() => MediaEntryFilterArgs, {
      validateFn: (arg: MediaEntryFilterArgs) => {
        if (arg.movieFilter && arg.episodeFilter) {
          throw new Error("Cannot provide both movieFilter and episodeFilter");
        }

        if (!arg.movieFilter && !arg.episodeFilter) {
          throw new Error("Must provide either movieFilter or episodeFilter");
        }
      },
    })
    { movieFilter, episodeFilter }: MediaEntryFilterArgs,
  ) {
    if (movieFilter) {
      const { tmdbId } = movieFilter;

      return em.findAll(MediaEntry, {
        where: {
          mediaItem: {
            type: "movie",
            tmdbId,
          },
        },
      });
    }

    if (episodeFilter) {
      const { tvdbId, seasonNumber, episodeNumber } = episodeFilter;

      if (tvdbId && seasonNumber && episodeNumber) {
        return em.findAll(MediaEntry, {
          where: {
            mediaItem: {
              type: "episode",
              number: episodeNumber,
              season: {
                number: seasonNumber,
              },
            },
          },
        });
      }
    }

    throw new Error(
      "Either tmdbId or tvdbId with seasonNumber and episodeNumber must be provided",
    );
  }

  @Mutation(() => MediaEntry)
  async saveStreamUrl(
    @Ctx() { em }: ApolloServerContext,
    @Arg("id", () => ID) id: string,
    @Arg("url", () => String) url: string,
  ): Promise<MediaEntry> {
    const entry = await em.findOneOrFail(MediaEntry, id);

    em.assign(entry, {
      streamUrl: url,
    });

    await em.flush();

    return entry;
  }
}
