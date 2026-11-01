import { faker } from "@faker-js/faker";

import { preview } from "#.storybook/preview.tsx";
import { ItemGrid } from "#components/item-grid/item-grid.tsx";
import { ListItem } from "#components/list-item/list-item.tsx";
import { PortraitCardSkeleton } from "#components/portrait-card/portrait-card-skeleton.tsx";

const meta = preview.meta({
  title: "Components / ItemGrid",
  component: ItemGrid,
});

export const Default = meta.story({
  args: {
    children: Array.from({ length: 12 }).map((_, index) => {
      const id = `movie-${String(index + 1)}`;

      return (
        <div key={id} className="aspect-2/3 w-full">
          <ListItem
            mediaItem={{
              id,
              title: faker.lorem.words(3),
              posterUrl: faker.image.urlPicsumPhotos({
                width: 200,
                height: 300,
              }),
              type: "movie",
              year: faker.date.past({ years: 10 }).getFullYear(),
            }}
            href={`/details/media/movie/${id}`}
          />
        </div>
      );
    }),
  },
});

export const Loading = meta.story({
  args: {
    children: [...Array.from({ length: 12 }).keys()].map((index) => (
      <PortraitCardSkeleton key={index} />
    )),
  },
});
