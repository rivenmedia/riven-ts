import { expect } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { getJob } from "../../../../../_data/queue-data.ts";
import { jobHref } from "../../../../../_utilities/queue-routes.ts";
import { FlowTree } from "./flow-tree.tsx";

const job = getJob("scrape-item", "48213");

if (!job) {
  throw new Error("Missing fixture job 48213");
}

const meta = preview.meta({
  title: "Pages / Queues / Components / FlowTree",
  component: FlowTree,
  args: {
    root: job.flow,
    currentJobId: "48213",
    currentQueueName: "scrape-item",
  },
});

export const Default = meta.story();

Default.test("Links every node to its job", async ({ canvas }) => {
  const links = canvas.getAllByRole("link");

  await expect(links).toHaveLength(6);
  await expect(
    canvas.getByRole("link", { name: "scrape-item #48213" }),
  ).toHaveAttribute("href", jobHref("scrape-item", "48213"));
  await expect(
    canvas.getByRole("link", { name: "process-item-request #48177" }),
  ).toHaveAttribute("href", jobHref("process-item-request", "48177"));
});

Default.test("Marks the current node", async ({ canvas }) => {
  await expect(
    canvas.getByRole("link", { name: "scrape-item #48213" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(canvas.getByText(/· this job/u)).toBeVisible();
  await expect(
    canvas.getByRole("link", { name: "process-media-item #48190" }),
  ).not.toHaveAttribute("aria-current");
});

Default.test("Notes a failure the parent ignored", async ({ canvas }) => {
  await expect(
    canvas.getByText(/· parent ignored this failure/u),
  ).toBeVisible();
});

Default.test("Collapses and expands a node", async ({ canvas, userEvent }) => {
  const toggle = canvas.getByRole("button", {
    name: "Collapse scrape-item #48213",
  });

  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  await userEvent.click(toggle);

  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toHaveAccessibleName("Expand scrape-item #48213");
  await expect(canvas.getAllByRole("link")).toHaveLength(3);
  await expect(canvas.queryByText("parse-scrape-results")).toBeNull();

  await userEvent.click(toggle);

  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(canvas.getAllByRole("link")).toHaveLength(6);
});

export const SingleJob = meta.story({
  args: {
    root: { id: "1", queueName: "scrape-item", state: "waiting", children: [] },
    currentJobId: "1",
    currentQueueName: "scrape-item",
  },
});

SingleJob.test("Has nothing to collapse", async ({ canvas }) => {
  await expect(canvas.getAllByRole("link")).toHaveLength(1);
  await expect(canvas.queryByRole("button")).toBeNull();
});

export const SharedIds = meta.story({
  args: {
    root: {
      id: "7",
      queueName: "process-item-request",
      state: "completed",
      children: [
        {
          id: "7",
          queueName: "scrape-item",
          state: "completed",
          children: [
            {
              id: "9",
              queueName: "parse-scrape-results",
              state: "completed",
              children: [],
            },
          ],
        },
      ],
    },
    currentJobId: "7",
    currentQueueName: "scrape-item",
  },
});

SharedIds.test(
  "Marks only the node in the current queue when ids match",
  async ({ canvas }) => {
    await expect(
      canvas.getByRole("link", { name: "scrape-item #7" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      canvas.getByRole("link", { name: "process-item-request #7" }),
    ).not.toHaveAttribute("aria-current");
    await expect(canvas.getAllByText(/· this job/u)).toHaveLength(1);
  },
);

SharedIds.test(
  "Collapses only the node in its own queue",
  async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Collapse scrape-item #7" }),
    );

    await expect(
      canvas.getByRole("link", { name: "scrape-item #7" }),
    ).toBeInTheDocument();
    await expect(canvas.queryByText("parse-scrape-results")).toBeNull();
    await expect(
      canvas.getByRole("button", { name: "Collapse process-item-request #7" }),
    ).toHaveAttribute("aria-expanded", "true");
  },
);
