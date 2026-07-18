import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { preview } from "@/.storybook/preview";

import { Header } from "./header";

const meta = preview.meta({
  title: "Components / Media / Header",
  component: Header,
  args: {
    modifierKey: "⌃" as const,
  },
  parameters: {
    layout: "fullscreen",
  },
});

export const Default = meta.story({});

Default.test(
  "When not on the explore page, it navigates with .push()",
  async ({ canvasElement }) => {
    const router = getRouter();
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: /search/i });

    await userEvent.type(input, "test search query");

    await waitFor(async () => {
      await expect(router.push).toHaveBeenCalledWith(
        "/explore?query=test%20search%20query",
        { scroll: false },
      );
    });
  },
);

Default.test(
  "When already on the explore page, it navigates with .replace()",
  {
    parameters: {
      nextjs: {
        navigation: {
          pathname: "/explore",
        },
      },
    },
  },
  async ({ canvasElement }) => {
    const router = getRouter();
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: /search/i });

    await userEvent.type(input, "test search query");

    await waitFor(async () => {
      await expect(router.replace).toHaveBeenCalledWith(
        "/explore?query=test%20search%20query",
        { scroll: false },
      );
    });
  },
);
