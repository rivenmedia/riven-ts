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
  component: FlowTree,
  args: { root: job.flow, currentJobId: "48213" },
});

export const Default = meta.story();

Default.test("links every node to its job", async ({ canvas }) => {
  const links = canvas.getAllByRole("link");

  await expect(links).toHaveLength(6);
  await expect(
    canvas.getByRole("link", { name: "scrape-item #48213" }),
  ).toHaveAttribute("href", jobHref("scrape-item", "48213"));
  await expect(
    canvas.getByRole("link", { name: "process-item-request #48177" }),
  ).toHaveAttribute("href", jobHref("process-item-request", "48177"));
});

Default.test("marks the current node", async ({ canvas }) => {
  await expect(
    canvas.getByRole("link", { name: "scrape-item #48213" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(canvas.getByText(/· this job/u)).toBeVisible();
  await expect(
    canvas.getByRole("link", { name: "process-media-item #48190" }),
  ).not.toHaveAttribute("aria-current");
});

Default.test("notes a failure the parent ignored", async ({ canvas }) => {
  await expect(
    canvas.getByText(/· parent ignored this failure/u),
  ).toBeVisible();
});

Default.test("collapses and expands a node", async ({ canvas, userEvent }) => {
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
  },
});

SingleJob.test("has nothing to collapse", async ({ canvas }) => {
  await expect(canvas.getAllByRole("link")).toHaveLength(1);
  await expect(canvas.queryByRole("button")).toBeNull();
});
