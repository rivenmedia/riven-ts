import "@/lib/styles/themes/all.css";
import "@/lib/styles/globals.css";
import "@/lib/styles/app.css";
import { fontMono, fontSansSerif, fontSerif } from "@/app/fonts";
import { Providers } from "@/components/providers";

import chromaticAddon from "@chromatic-com/storybook";
import addonA11y from "@storybook/addon-a11y";
import addonDocs from "@storybook/addon-docs";
import addonVitest from "@storybook/addon-vitest";
import { definePreview } from "@storybook/nextjs-vite";
import mswAddon from "msw-storybook-addon";
import { useEffect } from "react";
import { themes } from "storybook/theming";

export const preview = definePreview({
  tags: ["autodocs"],
  addons: [
    addonA11y(),
    addonDocs(),
    addonVitest(),
    mswAddon(),
    chromaticAddon(),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/iu,
        date: /Date$/iu,
      },
    },
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
    options: {
      storySort: {
        method: "alphabetical",
      },
    },
  },
  decorators: [
    (Story) => {
      useEffect(() => {
        // Add the font variables to the html tag
        document.documentElement.classList.add(
          fontSansSerif.variable,
          fontMono.variable,
          fontSerif.variable,
          "dark",
        );
      }, []);

      return (
        <Providers>
          <Story />
        </Providers>
      );
    },
  ],
});

export default preview;
