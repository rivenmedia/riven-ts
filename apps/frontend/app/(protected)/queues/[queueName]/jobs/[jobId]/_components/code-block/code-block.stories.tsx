import { expect } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { CodeBlock } from "./code-block.tsx";

const meta = preview.meta({
  component: CodeBlock,
  args: {
    label: "Stack trace",
    children:
      "Error: No streams passed ranking (0 of 41)\n    at scrapeItemProcessor (lib/message-queue/flows/process-media-item/steps/scrape/scrape-item.processor.ts:112:13)",
  },
});

export const Default = meta.story();

Default.test(
  "can be focused to scroll by keyboard",
  async ({ canvas, userEvent }) => {
    const block = canvas.getByRole("region", { name: "Stack trace" });

    await userEvent.tab();

    await expect(block).toHaveFocus();
    await expect(block).toHaveTextContent(/scrape-item\.processor\.ts/u);
  },
);
