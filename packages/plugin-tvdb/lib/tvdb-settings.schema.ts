import { type } from "arktype";

export const TvdbSettings = type({
  apiKey: type("string")
    .describe("The TVDB API key used to request a token.")
    .default("6be85335-5c4f-4d8d-b945-d3ed0eb8cdce"),
});

export type TvdbSettings = typeof TvdbSettings.infer;
