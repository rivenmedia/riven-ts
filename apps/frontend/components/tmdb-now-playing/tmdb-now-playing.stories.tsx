import { preview } from "@/.storybook/preview";

import { expect, waitFor } from "storybook/test";

import { TmdbNowPlaying } from "./tmdb-now-playing";

const meta = preview.meta({
  title: "Components / TmdbNowPlaying",
  component: TmdbNowPlaying,
  args: {
    autoplayDelay: 5000,
    data: [
      {
        id: 603_692,
        mediaType: "movie",
        title: "John Wick: Chapter 4",
        backdropPath:
          "https://image.tmdb.org/t/p/original/i3OTGmLNOZIo4SRQLVfLjeWegB6.jpg",
        releaseDate: "2023-03-24",
        voteAverage: 7.8,
        originalLanguage: "en",
        overview:
          "With the price on his head ever increasing, John Wick uncovers a path to defeating The High Table.",
        genreIds: [28, 53],
      },
      {
        id: 94_605,
        mediaType: "tv",
        title: "Arcane",
        backdropPath:
          "https://image.tmdb.org/t/p/original/sYXLeu5usz6yEz0k00FYvtEdodD.jpg",
        firstAirDate: "2024-11-09",
        voteAverage: 9.1,
        originalLanguage: "en",
        overview:
          "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war.",
        genreIds: [16, 10_759],
      },
      {
        id: 94_605,
        mediaType: "movie",
        title: "Insidious: Out of the Further",
        backdropPath:
          "https://image.tmdb.org/t/p/original/hD8y787ciNWQ2bn396YrSsOIzdN.jpg",
        releaseDate: "2026-08-21",
        voteAverage: 6.5,
        originalLanguage: "en",
        overview:
          "Gemma, a young mother raising her daughter in the house she grew up in, discovers she can travel into The Further, where she possesses an ability to bring what lives there back to the real world.",
        genreIds: [27],
      },
    ],
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
