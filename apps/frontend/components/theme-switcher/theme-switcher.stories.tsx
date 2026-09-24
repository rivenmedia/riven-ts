import preview from "@/.storybook/preview";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { ThemeSwitcher } from "./theme-switcher";

const meta = preview.meta({
  title: "Components/Theme Switcher",
  component: ThemeSwitcher,
});

export const Default = meta.story({});

Default.test(
  "Switches the theme when a selection is made",
  async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const testCases = [
      [/amber minimal/iu, "amberminimal"],
      [/amethyst haze/iu, "amethysthaze"],
    ] as const;

    const body = within(canvasElement.ownerDocument.body);

    for (const [themeName, themeValue] of testCases) {
      const button = await canvas.findByRole("button", {
        name: /change theme/iu,
      });

      await userEvent.click(button);

      const menu = within(
        await body.findByRole("menu", {
          name: /change theme/iu,
        }),
      );

      const themeOption = await menu.findByRole("menuitem", {
        name: themeName,
      });

      await userEvent.click(themeOption);

      await waitFor(async () => {
        await expect(document.documentElement).toHaveAttribute(
          "data-theme",
          themeValue,
        );
      });
    }
  },
);
