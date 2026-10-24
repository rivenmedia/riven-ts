import { faker } from "@faker-js/faker";

import type { ListItem } from "#components/list-item/list-item.tsx";
import type { ComponentProps } from "react";

type MediaItem = ComponentProps<typeof ListItem>["mediaItem"];

export const pageSize = 20;

function createPage(page: number) {
  return new Map<string, MediaItem>(
    Array.from({ length: pageSize }).map((_, index) => {
      const position = (page - 1) * pageSize + index + 1;
      const id = `movie-${String(position)}`;

      return [
        id,
        {
          id,
          title: `Result ${String(position)}`,
          posterUrl: faker.image.urlPicsumPhotos({ width: 200, height: 300 }),
          type: "movie",
          year: 2000 + index,
          isRequestable: true,
        },
      ];
    }),
  );
}

export const firstPage = createPage(1);
export const pages = [firstPage, createPage(2), createPage(3)];
