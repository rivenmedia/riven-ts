import { preview } from "@/.storybook/preview";

import { fn } from "storybook/test";

import GlobalErrorPage from "./global-error";

const meta = preview.meta({
  title: "Components / GlobalErrorPage",
  component: GlobalErrorPage,
  args: {
    reset: fn(),
    retry: fn(),
  },
});

export const NotFound = meta.story({
  args: {
    error: new Error("Status code 404"),
  },
});

export const Forbidden = meta.story({
  args: {
    error: new Error("Status code 403"),
  },
});

export const InternalServerError = meta.story({
  args: {
    error: new Error("Status code 500"),
  },
});

export const BadRequest = meta.story({
  args: {
    error: new Error("Status code 400"),
  },
});
