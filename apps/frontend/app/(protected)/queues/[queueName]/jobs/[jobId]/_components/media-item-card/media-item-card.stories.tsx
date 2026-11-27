import { expect } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { MediaItemCard } from "./media-item-card.tsx";

const meta = preview.meta({
  title: "Pages / Queues / Components / MediaItemCard",
  component: MediaItemCard,
  args: {
    mediaItem: {
      title: "Severance",
      subtitle: "Season 2, episode 7",
      detailsPath: "/details/media/show/95396",
    },
  },
});

export const Default = meta.story();

Default.test("Links to the media item", async ({ canvas }) => {
  await expect(canvas.getByText("Severance")).toBeVisible();
  await expect(canvas.getByText("Season 2, episode 7")).toBeVisible();
  await expect(canvas.getByRole("link", { name: "Open item" })).toHaveAttribute(
    "href",
    "/details/media/show/95396",
  );
});
