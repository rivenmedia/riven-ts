import { Movie } from "@repo/util-plugin-sdk/dto/entities";
import { MovieContentRating } from "@repo/util-plugin-sdk/dto/enums/content-ratings.enum";

import { faker } from "@faker-js/faker";
import { Factory } from "@mikro-orm/seeder";

import { MovieItemRequestFactory } from "./movie-item-request.factory.ts";

import type { EntityData } from "@mikro-orm/core";

export class MovieFactory extends Factory<Movie> {
  model = Movie;

  protected override definition(
    input: EntityData<Movie> = {},
  ): EntityData<Movie> {
    const itemRequest =
      input.itemRequest ?? new MovieItemRequestFactory(this.em).makeEntity();

    return {
      title: faker.book.title(),
      posterPath: faker.image.url(),
      contentRating: faker.helpers.arrayElement(MovieContentRating.options),
      itemRequest,
      tmdbId: faker.number.int({ min: 1 }).toString(),
      ...input,
      isRequested: true, // Movies are always requested
    };
  }
}
