import { type AnyHandler, http, passthrough } from "msw";
import {
  applyRequestHandlers,
  initialize,
  mswLoader,
} from "msw-storybook-addon";
import { definePreviewAddon } from "storybook/internal/csf";

initialize({ onUnhandledRequest: "error" });

applyRequestHandlers({
  handlers: [http.get("**/@id/virtual:next/image", passthrough)],
});

// TODO: Remove once https://github.com/mswjs/msw-storybook-addon/pull/182 has been merged
export const mswAddon = definePreviewAddon<{
  parameters: {
    msw?: {
      handlers: AnyHandler[];
    };
  };
}>({
  loaders: [mswLoader],
});
