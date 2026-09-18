import { preview } from "@/.storybook/preview";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Badge } from "../_ui/badge";
import { PortraitCard } from "./portrait-card";

const meta = preview.meta({
  title: "Components / PortraitCard",
  component: PortraitCard,
  args: {
    title: "Portrait Card",
    onSelectToggle: fn(),
  },
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div className="w-48">
        <Story />
      </div>
    ),
  ],
});

export const Default = meta.story({
  args: {
    title: "John Wick: Chapter 4",
    image: "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
  },
});

Default.test("The image is rendered", async ({ canvasElement, args }) => {
  const canvas = within(canvasElement);

  await waitFor(async () => {
    await expect(canvas.getByAltText(args.title)).toBeInTheDocument();
  });
});

Default.test(
  "The content overlay is rendered",
  async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await waitFor(async () => {
      await expect(canvas.getByText(args.title)).toBeInTheDocument();
    });
  },
);

export const NoImage = meta.story({
  args: {
    image: null,
  },
});

export const WithSubtitle = meta.story({
  args: {
    title: "Arcane",
    subtitle: "S2 · 9 Episodes",
    image: "https://image.tmdb.org/t/p/w500/2a9yqmNUtdHg3QPUxB6JFO3Z7sz.jpg",
  } as const,
});

WithSubtitle.test(
  "The subtitle is rendered",
  async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await waitFor(async () => {
      if (!args.subtitle) {
        throw new Error("Subtitle is required for this test");
      }

      await expect(canvas.getByText(args.subtitle)).toBeInTheDocument();
    });
  },
);

export const Selectable = meta.story({
  args: {
    image: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    isSelectable: true,
    title: "Dune: Part Two",
  },
});

Selectable.test(
  "When isSelectable is true, the select button is rendered",
  async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(async () => {
      await expect(canvas.getByRole("checkbox")).toBeInTheDocument();
    });
  },
);

Selectable.test(
  "When the select button is clicked, it toggles the item selection state",
  async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const button = await canvas.findByRole("checkbox");

    await userEvent.click(button);

    await expect(button).toBeChecked();
    await expect(args.onSelectToggle).toBeCalledTimes(1);

    await userEvent.click(button);

    await expect(button).not.toBeChecked();
    await expect(args.onSelectToggle).toBeCalledTimes(2);
  },
);

export const Selected = Selectable.extend({
  args: {
    defaultSelected: true,
  },
});

Selected.test(
  "When defaultSelected is true, the select button is checked",
  async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(async () => {
      const button = await canvas.findByRole("checkbox");

      await expect(button).toBeChecked();
    });
  },
);

export const NoContentOverlay = meta.story({
  args: {
    title: "Arcane",
    image: "https://image.tmdb.org/t/p/w500/2a9yqmNUtdHg3QPUxB6JFO3Z7sz.jpg",
    showContent: false,
  },
});

NoContentOverlay.test(
  "When showContent is false, the content overlay is not rendered",
  async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(async () => {
      await expect(canvas.queryByText(/Arcane/iu)).not.toBeInTheDocument();
    });
  },
);

export const WithTopRight = meta.story({
  args: {
    title: "Arcane",
    image: "https://image.tmdb.org/t/p/w500/2a9yqmNUtdHg3QPUxB6JFO3Z7sz.jpg",
    topRight: (
      <Badge className="border-white/10 px-2 py-0.5 text-[10px] shadow-sm backdrop-blur-md bg-green-600/90 text-white border-0">
        New
      </Badge>
    ),
  },
});

WithTopRight.test(
  "When topRight is provided, the top right content is rendered",
  async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(async () => {
      await expect(canvas.getByText(/New/iu)).toBeInTheDocument();
    });
  },
);
