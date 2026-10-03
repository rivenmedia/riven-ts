import "./types.d.ts";
import "@/lib/styles/themes/all.css";
import "@/lib/styles/globals.css";
import { i18n } from "@/.storybook/i18n";
import { fontMono, fontSansSerif, fontSerif } from "@/app/fonts";
import { Providers } from "@/components/providers";

import { resetApolloClientSingletons } from "@apollo/client-integration-nextjs";
import addonA11y from "@storybook/addon-a11y";
import addonDocs from "@storybook/addon-docs";
import addonVitest from "@storybook/addon-vitest";
import { definePreview } from "@storybook/nextjs-vite";
import { headers } from "@storybook/nextjs-vite/headers.mock";
import mswAddon from "msw-storybook-addon";
import { Suspense, useLayoutEffect } from "react";
import { toast } from "sonner";
import addonVis from "storybook-addon-vis";
import { expect, sb } from "storybook/test";
import { themes } from "storybook/theming";

import { WithI18n } from "./decorators/with-i18n";
import { WithReducedMotionCheck } from "./decorators/with-reduced-motion-check.tsx";
import { prepareAutoSnapshot, resetAutoSnapshot } from "./visual-testing.ts";

import type { SnapshotParameters } from "./visual-testing.ts";

sb.mock(import("../lib/graphql/client.ts"));

declare module "@storybook/nextjs-vite" {
  interface Parameters {
    snapshot?: SnapshotParameters;
  }
}

declare module "storybook/test" {
  interface Expect {
    assert: (value: unknown, message?: string) => asserts value;
    fail: (message?: string) => never;
  }
}

Object.assign(expect, {
  assert: (value: unknown): asserts value => {
    if (!value) {
      expect(value)
        .toBeDefined()
        .catch(() => {
          /* empty */
        });
    }
  },
});

declare module "storybook/internal/csf" {
  interface StoryContext {
    parameters: {
      i18n: typeof i18n;
    };
    globals: {
      locale: string;
    };
  }
}

export const preview = definePreview({
  // `snapshot` enables an automatic visual snapshot for every story - opt out with `!snapshot`
  tags: ["autodocs", "snapshot"],
  addons: [
    addonA11y(),
    addonDocs(),
    addonVitest(),
    mswAddon(),
    addonVis({ auto: prepareAutoSnapshot }),
  ],
  parameters: {
    i18n,
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
  globalTypes: {
    locale: {
      name: "Locale",
      description: "Internationalization locale",
      defaultValue: "en-GB",
      toolbar: {
        icon: "globe",
        items: [
          { value: "en-GB", title: "English (GB)" },
          { value: "en-US", title: "English (US)" },
          { value: "fr-FR", title: "Français" },
          { value: "fa-IR", title: "فارسی" },
        ],
      },
    },
  },
  decorators: [
    WithReducedMotionCheck,
    WithI18n,
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
          <Suspense>
            <Story />
          </Suspense>
        </Providers>
      );
    },
  ],
  beforeEach({ globals }) {
    resetAutoSnapshot();
    resetApolloClientSingletons(); // Clear Apollo Client cache to prevent stale data between stories
    toast.dismiss();

    headers().append("accept-language", globals.locale);
  },
});

export default preview;
