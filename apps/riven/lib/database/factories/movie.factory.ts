import { Movie } from "@repo/util-plugin-sdk/dto/entities";
import { MovieContentRating } from "@repo/util-plugin-sdk/dto/enums/content-ratings.enum";

import { faker } from "@faker-js/faker";
import { Factory } from "@mikro-orm/seeder";

import { MovieItemRequestFactory } from "./movie-item-request.factory.ts";

import type { EntityData } from "@mikro-orm/core";

export class MovieFactory extends Factory<Movie> {
  public model = Movie;

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
      tmdbId: faker.string.numeric({ length: { min: 1, max: 10 } }),
      ...input,
      isRequested: true, // Movies are always requested
    };
  }
}
