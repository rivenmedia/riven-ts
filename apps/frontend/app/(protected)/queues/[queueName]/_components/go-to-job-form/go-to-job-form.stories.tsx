import { expect, spyOn } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { GoToJobForm } from "./go-to-job-form.tsx";

const meta = preview.meta({
  title: "Pages / Queues / Components / GoToJobForm",
  component: GoToJobForm,
  args: { queueName: "scrape-item" },
});

export const Default = meta.story();

Default.test(
  "Disables Open until there is an ID",
  async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("button", { name: "Open" })).toBeDisabled();

    await userEvent.type(canvas.getByLabelText("Go to job"), "   ");

    await expect(canvas.getByRole("button", { name: "Open" })).toBeDisabled();
  },
);

Default.test("Opens the job in a new tab", async ({ canvas, userEvent }) => {
  const open = spyOn(globalThis, "open").mockReturnValue(null);

  await userEvent.type(canvas.getByLabelText("Go to job"), " 48213 ");
  await userEvent.click(canvas.getByRole("button", { name: "Open" }));

  await expect(open).toHaveBeenCalledWith(
    "/queues/scrape-item/jobs/48213",
    "_blank",
    "noopener",
  );
});
