import { preview } from "@/.storybook/preview";

import { expect, waitFor } from "storybook/test";

import { NowPlaying } from "./now-playing";
import { NowPlayingSkeleton } from "./now-playing-skeleton";

import type { NowPlayingItem } from "./now-playing";

const meta = preview.meta({
  title: "Components / NowPlaying",
  component: NowPlaying,
  subcomponents: {
    NowPlayingSkeleton,
  },
  args: {
    autoplayDelay: 5000,
    data: [
      {
        id: "603692",
        mediaType: "movie",
        title: "John Wick: Chapter 4",
        backdropPath:
          "https://image.tmdb.org/t/p/original/i3OTGmLNOZIo4SRQLVfLjeWegB6.jpg",
        releaseDate: "2023-03-24",
        voteAverage: 7.8,
        originalLanguage: "en",
        overview:
          "With the price on his head ever increasing, John Wick uncovers a path to defeating The High Table.",
        genres: ["Action", "Thriller"],
        certification: "15",
        ratings: [
          {
            name: "imdb",
            image: "imdb.svg",
            score: "7.6",
            url: "https://www.imdb.com/title/tt10366206/",
          },
          {
            name: "rottentomatoes",
            image: "rottentomatoes_certified_fresh.svg",
            score: "94%",
            url: "https://www.rottentomatoes.com/m/john_wick_chapter_4",
          },
        ],
        logo: null,
      },
      {
        id: "94605",
        mediaType: "show",
        title: "Arcane",
        backdropPath:
          "https://image.tmdb.org/t/p/original/sYXLeu5usz6yEz0k00FYvtEdodD.jpg",
        firstAirDate: "2024-11-09",
        voteAverage: 9.1,
        originalLanguage: "en",
        overview:
          "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war.",
        genres: ["Animation", "Action & Adventure"],
        certification: "12A",
        ratings: [],
        logo: null,
      },
      {
        id: "1291595",
        mediaType: "movie",
        title: "Insidious: Out of the Further",
        backdropPath:
          "https://image.tmdb.org/t/p/original/hD8y787ciNWQ2bn396YrSsOIzdN.jpg",
        releaseDate: "2026-08-21",
        voteAverage: 6.5,
        originalLanguage: "en",
        overview:
          "Gemma, a young mother raising her daughter in the house she grew up in, discovers she can travel into The Further, where she possesses an ability to bring what lives there back to the real world.",
        genres: ["Horror"],
        certification: "18",
        ratings: [],
        logo: null,
      },
    ] satisfies NowPlayingItem[],
  },
});

export const Default = meta.story();

Default.test(
  "Navigates to the next slide when the next button is clicked",
  {
    parameters: {
      chromatic: {
        disableSnapshot: true,
      },
    },
  },
  async ({ canvas, userEvent, step }) => {
    const firstSlideTitle = await canvas.findByRole("heading", {
      name: /john wick: chapter 4/iu,
    });

    await step("Verify the first slide is visible", async () => {
      await waitFor(async () => expect(firstSlideTitle).toBeVisible(), {
        interval: 100,
      });
    });

    await step("Click the next button", async () => {
      const nextButton = await canvas.findByRole("button", { name: /next/iu });

      await userEvent.click(nextButton);
    });

    await step("Verify the next slide is visible", async () => {
      await waitFor(async () =>
        expect(
          canvas.getByRole("heading", {
            name: /arcane/iu,
          }),
        ).toBeVisible(),
      );

      await expect(firstSlideTitle).not.toBeVisible();
    });
  },
);

Default.test(
  "Navigates to the previous slide when the previous button is clicked",
  {
    parameters: {
      chromatic: {
        disableSnapshot: true,
      },
    },
  },
  async ({ canvas, userEvent, step }) => {
    const firstSlideTitle = await canvas.findByRole("heading", {
      name: /john wick: chapter 4/iu,
    });

    await step("Verify the first slide is visible", async () => {
      await waitFor(async () => expect(firstSlideTitle).toBeVisible(), {
        interval: 100,
      });
    });

    await step("Click the previous button", async () => {
      const previousButton = await canvas.findByRole("button", {
        name: /previous/iu,
      });

      await userEvent.click(previousButton);
    });

    await step("Verify the previous slide is visible", async () => {
      await waitFor(async () =>
        expect(
          canvas.getByRole("heading", {
            name: /insidious: out of the further/iu,
          }),
        ).toBeVisible(),
      );
    });

    await expect(firstSlideTitle).not.toBeVisible();
  },
);

Default.test(
  "Pauses the autoplay when the carousel is hovered",
  {
    args: {
      autoplayDelay: 1000,
    },
    parameters: {
      chromatic: {
        disableSnapshot: true,
      },
    },
  },
  async ({ args, canvas, userEvent, step }) => {
    const carousel = await canvas.findByRole("region", {
      name: /now playing movies/iu,
    });

    await step("Verify the first slide is visible", async () => {
      const firstSlideTitle = await canvas.findByRole("heading", {
        name: /john wick: chapter 4/iu,
      });

      await waitFor(async () => expect(firstSlideTitle).toBeVisible());
    });

    await step("Hover over the carousel", async () => {
      await userEvent.hover(carousel);
    });

    const waitDuration = Number(args.autoplayDelay) + 1000;

    await step(
      `Wait for ${(waitDuration / 1000).toString()} seconds`,
      async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, waitDuration);
        });
      },
    );

    await step("Verify the first slide is still visible", async () => {
      const firstSlideTitle = await canvas.findByRole("heading", {
        name: /john wick: chapter 4/iu,
      });

      await waitFor(async () => expect(firstSlideTitle).toBeVisible());
    });
  },
);

Default.test(
  "Autoplays the carousel when not hovered",
  {
    args: {
      autoplayDelay: 1000,
    },
    parameters: {
      chromatic: {
        disableSnapshot: true,
      },
    },
  },
  async ({ args, canvas, step }) => {
    const firstSlideTitle = await canvas.findByRole("heading", {
      name: /john wick: chapter 4/iu,
    });

    await step("Verify the first slide is visible", async () => {
      await waitFor(async () => expect(firstSlideTitle).toBeVisible());
    });

    await step("Wait for the next slide to appear", async () => {
      await waitFor(async () => expect(firstSlideTitle).not.toBeVisible(), {
        timeout: Number(args.autoplayDelay) + 1000,
      });
    });

    await step("Verify the first slide is not still visible", async () => {
      await expect(firstSlideTitle).not.toBeVisible();
    });
  },
);

Default.test(
  "Resets the autoplay when the slide changes",
  {
    args: {
      autoplayDelay: 5000,
    },
    parameters: {
      chromatic: {
        disableSnapshot: true,
      },
    },
  },
  async ({ args, canvas, userEvent, step }) => {
    const firstSlideTitle = await canvas.findByRole("heading", {
      name: /john wick: chapter 4/iu,
    });

    await step("Verify the first slide is visible", async () => {
      await waitFor(async () => expect(firstSlideTitle).toBeVisible());
    });

    await step("Wait for a partial slide duration", async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, Number(args.autoplayDelay) / 2);
      });
    });

    await step("Click the previous button", async () => {
      const previousButton = await canvas.findByRole("button", {
        name: /previous/iu,
      });

      await userEvent.click(previousButton);
    });

    await step("Verify the previous slide is visible", async () => {
      await waitFor(async () =>
        expect(
          canvas.getByRole("heading", {
            name: /insidious: out of the further/iu,
          }),
        ).toBeVisible(),
      );
    });

    await step("Wait for a partial slide duration", async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, Number(args.autoplayDelay) / 2);
      });
    });

    await step("Verify the previous slide is still visible", async () => {
      await waitFor(async () =>
        expect(
          canvas.getByRole("heading", {
            name: /insidious: out of the further/iu,
          }),
        ).toBeVisible(),
      );
    });
  },
);

export const WithLongTitle = meta.story({
  args: {
    data: [
      {
        id: "1291594",
        mediaType: "movie",
        title: "The Assassination of Jesse James by the Coward Robert Ford",
        backdropPath:
          "https://image.tmdb.org/t/p/original/5r2BZajlRZqnOc6s2BS0aiFDcne.jpg",
        releaseDate: "2007-10-19",
        voteAverage: 7.5,
        originalLanguage: "en",
        overview:
          "Robert Ford, who has idolized Jesse James since childhood, tries hard to join the resurgent gang of the Missouri outlaw, but gradually becomes resentful of the bandit leader.",
        genres: ["Drama", "History", "Thriller"],
        certification: "R",
        ratings: [],
        logo: null,
      },
      {
        id: "1291593",
        mediaType: "movie",
        title:
          "Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb",
        backdropPath:
          "https://image.tmdb.org/t/p/original/4LmNLvXP5SZ5TrZEkNhC7dbjUNV.jpg",
        releaseDate: "1964-01-29",
        voteAverage: 8.3,
        originalLanguage: "en",
        overview:
          "After a rogue U.S. general orders an unauthorized nuclear attack on the Soviet Union, leaders in the War Room race to prevent global catastrophe.",
        genres: ["Drama", "History", "Thriller"],
        certification: "R",
        ratings: [],
        logo: null,
      },
      {
        id: "1291595",
        mediaType: "movie",
        title: "Insidious: Out of the Further",
        backdropPath:
          "https://image.tmdb.org/t/p/original/hD8y787ciNWQ2bn396YrSsOIzdN.jpg",
        releaseDate: "2026-08-21",
        voteAverage: 6.5,
        originalLanguage: "en",
        overview:
          "Gemma, a young mother raising her daughter in the house she grew up in, discovers she can travel into The Further, where she possesses an ability to bring what lives there back to the real world.",
        genres: ["Horror"],
        certification: "18",
        ratings: [],
        logo: null,
      },
    ],
  },
});

export const WithLogos = meta.story({
  args: {
    data: [
      {
        id: "603692",
        mediaType: "movie",
        title: "John Wick: Chapter 4",
        backdropPath:
          "https://image.tmdb.org/t/p/original/i3OTGmLNOZIo4SRQLVfLjeWegB6.jpg",
        releaseDate: "2023-03-24",
        voteAverage: 7.8,
        originalLanguage: "en",
        overview:
          "With the price on his head ever increasing, John Wick uncovers a path to defeating The High Table.",
        genres: ["Action", "Thriller"],
        certification: "15",
        ratings: [
          {
            name: "imdb",
            image: "imdb.svg",
            score: "7.6",
            url: "https://www.imdb.com/title/tt10366206/",
          },
          {
            name: "rottentomatoes",
            image: "rottentomatoes_certified_fresh.svg",
            score: "94%",
            url: "https://www.rottentomatoes.com/m/john_wick_chapter_4",
          },
        ],
        logo: "https://image.tmdb.org/t/p/original/24dIhRKjLnYRanA2Mo0ycZfObUp.png",
      },
      {
        id: "94605",
        mediaType: "show",
        title: "Arcane",
        backdropPath:
          "https://image.tmdb.org/t/p/original/sYXLeu5usz6yEz0k00FYvtEdodD.jpg",
        firstAirDate: "2024-11-09",
        voteAverage: 9.1,
        originalLanguage: "en",
        overview:
          "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war.",
        genres: ["Animation", "Action & Adventure"],
        certification: "12A",
        ratings: [],
        logo: "https://image.tmdb.org/t/p/original/jXLNOzeEA8AoJy92dJTUUZXTMxK.png",
      },
      {
        id: "1291595",
        mediaType: "movie",
        title: "Insidious: Out of the Further",
        backdropPath:
          "https://image.tmdb.org/t/p/original/hD8y787ciNWQ2bn396YrSsOIzdN.jpg",
        releaseDate: "2026-08-21",
        voteAverage: 6.5,
        originalLanguage: "en",
        overview:
          "Gemma, a young mother raising her daughter in the house she grew up in, discovers she can travel into The Further, where she possesses an ability to bring what lives there back to the real world.",
        genres: ["Horror"],
        certification: "18",
        ratings: [],
        logo: "https://image.tmdb.org/t/p/original/iGjbP4jYzzbINDtd9kScypQOlmw.png",
      },
    ],
  },
});

export const Loading = meta.story({
  render: () => <NowPlayingSkeleton heightClass="h-96" />,
});
