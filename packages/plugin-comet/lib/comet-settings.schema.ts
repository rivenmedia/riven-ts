import { type } from "arktype";

export const CometSettings = type({
  url: type("string.url")
    .describe("The URL of the Comet instance to connect to.")
    .default("https://comet.feels.legal"),
});

export type CometSettings = typeof CometSettings.infer;
