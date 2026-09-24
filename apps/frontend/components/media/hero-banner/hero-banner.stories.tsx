import { preview } from "@/.storybook/preview";

import { expect } from "storybook/test";

import { HeroBanner } from "./hero-banner";

const meta = preview.meta({
  title: "Media / HeroBanner",
  component: HeroBanner,
  args: {
    backdropPath:
      "https://image.tmdb.org/t/p/w1920/9E2y5Q7WlCVNEhP5GiVTjhEhx1o.jpg",
    logo: "https://image.tmdb.org/t/p/w500/nxUlI9IPiieWnzHviapG0akZkz8.png",
    trailer: null,
  },
});

export const Default = meta.story();

export const WithTrailer = meta.story({
  args: {
    trailer: { name: "Official Trailer", site: "YouTube", key: "dQw4w9WgXcQ" },
  },
});

WithTrailer.test(
  'Plays the trailer when the "Trailer" button is clicked and closes it when the "Close trailer" button is clicked',
  async ({ canvas, userEvent }) => {
    const trailerButton = canvas.getByRole("button", { name: /trailer/iu });

    await userEvent.click(trailerButton);

    const trailerIframe = await canvas.findByTitle("Trailer");

    await expect(trailerIframe).toBeVisible();
    await expect(trailerButton).not.toBeVisible();

    await expect(trailerIframe).toHaveAttribute(
      "src",
      expect.stringContaining("youtube-nocookie.com/embed/dQw4w9WgXcQ"),
    );

    const closeTrailerButton = canvas.getByRole("button", {
      name: /close trailer/iu,
    });

    await userEvent.click(closeTrailerButton);

    await expect(trailerIframe).not.toBeVisible();

    const trailerButtonAfterClose = canvas.getByRole("button", {
      name: /trailer/iu,
    });

    await expect(trailerButtonAfterClose).toBeVisible();
  },
);

export const NoLogo = meta.story({
  args: {
    logo: null,
  },
});

export const Empty = meta.story({
  args: {
    backdropPath: null,
    logo: null,
    trailer: null,
  },
});
