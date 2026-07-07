import "@/lib/styles/themes/all.css";
import "@/lib/styles/globals.css";
import "@/lib/styles/app.css";

import addonA11y from "@storybook/addon-a11y";
import addonDocs from "@storybook/addon-docs";
import addonVitest from "@storybook/addon-vitest";
import { definePreview } from "@storybook/nextjs-vite";
import { themes } from "storybook/theming";

import { Providers } from "@/components/providers";

import { mswAddon } from "./addons/msw";

export const preview = definePreview({
  tags: ["autodocs"],
  addons: [addonA11y(), addonDocs(), addonVitest(), mswAddon],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
    nextjs: {
      appDirectory: true,
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
    docs: {
      theme: themes.normal,
    },
    backgrounds: {
      disable: true,
    },
  },
  decorators: [
    (Story) => (
      <Providers>
        <Story />
      </Providers>
    ),
  ],
});

export default preview;
