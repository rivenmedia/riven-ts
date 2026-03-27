import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import { faker } from "@faker-js/faker";
import { Factory } from "@mikro-orm/seeder";

import type { EntityData } from "@mikro-orm/core";

export class MovieFactory extends Factory<Movie> {
  model = Movie;

  protected override definition(
    input: EntityData<Movie> = {},
  ): EntityData<Movie> {
    return {
      title: faker.book.title(),
      posterPath: faker.image.url(),
      contentRating: "g",
      isRequested: true,
      itemRequest: 1,
      tmdbId: faker.number.int({ min: 1 }).toString(),
      ...input,
    };
  }
}
