import { expect } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { getQueue } from "../../../_data/queue-data.ts";
import { emptyJobCounts } from "../../../_utilities/job-counts.ts";
import { JobStateTabs } from "./job-state-tabs.tsx";

const counts = getQueue("scrape-item")?.counts ?? emptyJobCounts();

const meta = preview.meta({
  title: "Pages / Queues / Components / JobStateTabs",
  component: JobStateTabs,
  args: {
    queueName: "scrape-item",
    counts,
    currentState: "failed",
    locale: "en-GB",
  },
});

export const Default = meta.story();

Default.test(
  "Lists the states in order with their counts",
  async ({ canvas }) => {
    const links = canvas.getAllByRole("link");

    await expect(links.map((link) => link.textContent)).toEqual([
      "Waiting58",
      "Prioritised4",
      "Awaiting children0",
      "Active3",
      "Scheduled12",
      "Failed9",
      "Completed6,930",
      "Paused0",
    ]);
    await expect(canvas.queryByText("Delayed")).not.toBeInTheDocument();
  },
);

Default.test("Marks the current state", async ({ canvas }) => {
  const failed = canvas.getByRole("link", { name: "Failed 9" });

  await expect(failed).toHaveAttribute("aria-current", "page");
  await expect(failed).toHaveAttribute(
    "href",
    "/queues/scrape-item?state=failed",
  );
  await expect(
    canvas.getByRole("link", { name: "Waiting 58" }),
  ).not.toHaveAttribute("aria-current");
});
