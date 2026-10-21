import { INITIAL_VIEWPORTS } from "storybook/viewport";

import { preview } from "#.storybook/preview.tsx";
import { MobileNav } from "#components/mobile-nav/mobile-nav.tsx";
import { NotificationsProvider } from "#components/providers/notifications-provider.tsx";

const meta = preview.meta({
  title: "Components / MobileNav",
  component: MobileNav,
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/",
      },
    },
    viewport: {
      options: INITIAL_VIEWPORTS,
    },
  },
  decorators: [
    (Story) => (
      <NotificationsProvider>
        <Story />
      </NotificationsProvider>
    ),
  ],
});

export const Default = meta.story({
  globals: {
    viewport: {
      value: "mobile1",
      isRotated: false,
    },
  },
});

export const Rotated = meta.story({
  globals: {
    viewport: {
      value: "mobile1",
      isRotated: true,
    },
  },
});

export const ConfigurableViewport = meta.story();

export const OnNonMainPage = meta.story({
  globals: {
    viewport: {
      value: "mobile1",
      isRotated: false,
    },
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/some",
      },
    },
  },
});
