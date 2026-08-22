import preview from "@/.storybook/preview";

import { expect, fn, userEvent, within } from "storybook/test";

import { AnimatedToggle } from "./animated-toggle";

const meta = preview.meta({
  title: "Components / AnimatedToggle",
  component: AnimatedToggle,
  parameters: {
    layout: "padded",
  },
  render: (args) => <AnimatedToggle {...args} />,
});

export const Default = meta.story({
  args: {
    options: [
      { label: "Movies", value: "movies" },
      { label: "TV Shows", value: "tv-shows" },
      { label: "Anime", value: "anime" },
    ],
    onChange: fn(),
  },
});

Default.test(
  "onChange is called when an option is clicked",
  async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const moviesButton = await canvas.findByRole("button", {
      name: /movies/iu,
    });
    const tvShowsButton = await canvas.findByRole("button", {
      name: /tv shows/iu,
    });
    const animeButton = await canvas.findByRole("button", { name: /anime/iu });

    await userEvent.click(moviesButton);
    await expect(args.onChange).toHaveBeenCalledWith("movies");

    await userEvent.click(tvShowsButton);
    await expect(args.onChange).toHaveBeenCalledWith("tv-shows");

    await userEvent.click(animeButton);
    await expect(args.onChange).toHaveBeenCalledWith("anime");
  },
);
