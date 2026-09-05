// oxlint-disable-next-line import/no-unassigned-import
import "msw-storybook-addon/types";
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
import { http, passthrough } from "msw";
import mswAddon from "msw-storybook-addon";
import { setupWorker } from "msw/browser";
import { useLayoutEffect } from "react";
import { toast } from "sonner";
import { themes } from "storybook/theming";

export const preview = definePreview({
  tags: ["autodocs"],
  addons: [
    addonA11y(),
    addonDocs(),
    addonVitest(),
    chromaticAddon(),
    mswAddon(async () => {
      const worker = setupWorker(
        http.get("https://picsum.photos/**", passthrough),
        http.get("**virtual:next/image**", passthrough),
      );

      await worker.start({
        // onUnhandledRequest: "error", // Don't send out real requests in Storybook, they should always be mocked
        serviceWorker: { url: "/mockServiceWorker.js" },
      });

      return worker;
    }),
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
      useLayoutEffect(() => {
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
  beforeEach() {
    toast.dismiss();
  },
});

export default preview;
