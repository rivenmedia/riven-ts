import { type AnyHandler, http, passthrough } from "msw";
import {
  applyRequestHandlers,
  initialize,
  mswLoader,
} from "msw-storybook-addon";
import { definePreviewAddon } from "storybook/internal/csf";

initialize();

applyRequestHandlers({
  handlers: [http.get("**/@id/virtual:next/image", passthrough)],
});

export interface MswAddonParameters {
  handlers?: AnyHandler[];
}

// TODO: Remove once https://github.com/mswjs/msw-storybook-addon/pull/182 has been merged
export const mswAddon = definePreviewAddon<{
  parameters: {
    msw?: MswAddonParameters;
  };
}>({
  loaders: [mswLoader],
});
