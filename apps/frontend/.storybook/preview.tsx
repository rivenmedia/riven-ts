import { fontMono, fontSansSerif, fontSerif } from "@/app/fonts";

import "@/lib/styles/themes/all.css";
import "@/lib/styles/globals.css";
import "@/lib/styles/app.css";

import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

import addonA11y from "@storybook/addon-a11y";
import addonDocs from "@storybook/addon-docs";
import addonVitest from "@storybook/addon-vitest";
import { definePreview } from "@storybook/nextjs-vite";
import { themes } from "storybook/theming";

export const preview = definePreview({
  tags: ["autodocs"],
  addons: [addonA11y(), addonDocs(), addonVitest()],
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
      options: {
        dark: {
          name: "Dark",
          value: "oklch(0.145 0 0)",
        },
        light: {
          name: "Light",
          value: "oklch(1 0 0)",
        },
      },
    },
  },
  initialGlobals: {
    backgrounds: {
      value: "dark",
    },
  },
  decorators: [
    (Story) => {
      return (
        <div
          className={cn(
            "h-full antialiased",
            fontSansSerif.variable,
            fontMono.variable,
            fontSerif.variable,
          )}
        >
          <Providers>
            <Story />
          </Providers>
        </div>
      );
    },
  ],
});

export default preview;
