import { preview } from "@/.storybook/preview";

import { INITIAL_VIEWPORTS } from "storybook/viewport";

import { NotificationsProvider } from "../providers/notifications-provider";
import { MobileNav } from "./mobile-nav";

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
