import { ItemRequest, Movie } from "@repo/util-plugin-sdk/dto/entities";
import { MovieContentRating } from "@repo/util-plugin-sdk/dto/enums/content-ratings.enum";
import { MediaItemIndexError } from "@repo/util-plugin-sdk/schemas/events/media-item.index.error.event";
import { MediaItemIndexErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.index.incorrect-state.event";

import { ValidationError, validateOrReject } from "class-validator";
import assert from "node:assert";
import { Field, ID, InputType, Int, ObjectType } from "type-graphql";
import z from "zod";

import { MutationResponse } from "../../../interfaces/mutation-response.interface.ts";
import { pubSub } from "../../../pub-sub.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { MediaItemIndexRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";
import type { UUID } from "node:crypto";

type IndexMovieData = Extract<
  NonNullable<MediaItemIndexRequestedResponse>["item"],
  { type: "movie" }
>;

@InputType()
export class IndexMovieInput implements Omit<IndexMovieData, "type"> {
  @Field(() => ID)
  id!: UUID;

  @Field(() => String)
  title!: string;

  @Field(() => String, { nullable: true })
  imdbId!: string | null;

  @Field(() => MovieContentRating.enum)
  contentRating!: z.infer<typeof MovieContentRating>;

  @Field(() => Number, { nullable: true })
  rating?: number | null;

  @Field(() => String, { nullable: true })
  posterUrl?: string | null;

  @Field(() => String, { nullable: true })
  releaseDate!: string | null;

  @Field(() => String, { nullable: true })
  country?: string | null;

  @Field(() => String, { nullable: true })
  language?: string | null;

  @Field(() => Object, { nullable: true })
  aliases?: Record<string, string[]> | null;

  @Field(() => [String])
  genres!: string[];

  @Field(() => Int, { nullable: true })
  runtime!: number | null;
}

@ObjectType({ implements: MutationResponse })
export class IndexMovieMutationResponse extends MutationResponse {
  @Field(() => Movie, { nullable: true })
  movie!: Movie | null;
}

export async function indexMovieMutation(
  em: EntityManager,
  item: IndexMovieInput,
) {
  const itemRequest = await em.findOneOrFail(ItemRequest, {
    id: item.id,
  });

  assert(
    itemRequest.state === "requested",
    new MediaItemIndexErrorIncorrectState({
      item: itemRequest,
    }),
  );

  const { tmdbId } = itemRequest;

  if (!tmdbId) {
    throw new MediaItemIndexError({
      item: itemRequest,
      error:
        "Item request is missing tmdbId, cannot persist movie indexer data",
    });
  }

  try {
    const movie = await em.transactional(async (transaction) => {
      const mediaItem = transaction.create(Movie, {
        title: item.title,
        imdbId: item.imdbId ?? itemRequest.imdbId ?? null,
        tmdbId,
        contentRating: item.contentRating,
        rating: item.rating ?? null,
        posterPath: item.posterUrl ?? null,
        releaseDate: item.releaseDate ?? null,
        country: item.country ?? null,
        language: item.language ?? null,
        aliases: item.aliases ?? null,
        genres: item.genres,
        itemRequest,
        runtime: item.runtime,
        isRequested: true, // Movies will always be considered to be requested
      });

      await validateOrReject(mediaItem);

      transaction.assign(itemRequest, {
        state: mediaItem.isReleased ? "completed" : "unreleased",
      });

      await transaction.flush();

      return mediaItem;
    });

    pubSub.publish("MEDIA_ITEM_INDEXED", movie);

    return movie;
  } catch (error) {
    const errorMessage = z
      .union([z.instanceof(Error), z.array(z.instanceof(ValidationError))])
      .transform((error) => {
        if (Array.isArray(error)) {
          return error
            .map((err) =>
              err.constraints ? Object.values(err.constraints).join("; ") : "",
            )
            .join("; ");
        }

        return error.message;
      })
      .parse(error);

    throw new MediaItemIndexError({
      item: itemRequest,
      error: errorMessage,
    });
  }
}
