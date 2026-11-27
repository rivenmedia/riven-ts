import { expect } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { getQueues } from "../../_data/queue-data.ts";
import { queueHref } from "../../_utilities/queue-routes.ts";
import { QueuesTable } from "./queues-table.tsx";

const meta = preview.meta({
  component: QueuesTable,
  args: { queues: getQueues(), locale: "en-GB" },
});

export const Default = meta.story();

Default.test("lists the three sections with counts", async ({ canvas }) => {
  await expect(canvas.getByText("All queues")).toBeInTheDocument();
  await expect(canvas.getByText("32 queues")).toBeInTheDocument();
  await expect(canvas.getByText("Flows · 10 queues")).toBeInTheDocument();
  await expect(
    canvas.getByText("Sandboxed jobs · 3 queues"),
  ).toBeInTheDocument();
  await expect(
    canvas.getByText("Plugins · 13 plugins, 19 queues"),
  ).toBeInTheDocument();
});

Default.test(
  "collapses plugin groups until they are expanded",
  async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("button", { name: /^Expand StremThru\b/u });

    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryAllByText(/^riven\..*stremthru/u)).toHaveLength(0);

    await userEvent.click(toggle);

    await expect(
      canvas.getByRole("button", { name: /^Collapse StremThru\b/u }),
    ).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getAllByText(/^riven\..*\[stremthru\]$/u)).toHaveLength(
      6,
    );
  },
);

Default.test(
  "links a plugin queue to its queue page",
  async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: /^Expand Torrentio\b/u }),
    );

    const link = canvas.getByRole("link", { name: "Scrape requested" });

    await expect(link).toHaveAttribute(
      "href",
      queueHref("riven.media-item.scrape.requested.plugin[torrentio]"),
    );
  },
);

Default.test("marks a paused queue", async ({ canvas }) => {
  const link = canvas.getByRole("link", { name: "Request subtitles" });

  await expect(link.parentElement).toHaveTextContent("Paused");
});

export const Empty = meta.story({ args: { queues: [] } });

Empty.test("explains that there are no queues", async ({ canvas }) => {
  await expect(canvas.getByText("No queues yet")).toBeInTheDocument();
});
