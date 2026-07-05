import { fontMono, fontSansSerif, fontSerif } from "@/app/fonts";

import "@/lib/styles/themes/all.css";
import "@/lib/styles/globals.css";
import "@/lib/styles/app.css";

import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

import { themes } from "storybook/theming";

import type { Preview } from "@storybook/nextjs-vite";

export const preview: Preview = {
  tags: ["autodocs"],
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
};

export default preview;
