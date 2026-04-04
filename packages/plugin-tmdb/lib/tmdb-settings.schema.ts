import { type } from "arktype";

export const TmdbSettings = type({
  apiKey: type("string > 0").describe("Your TMDB API Key"),
});

export type TmdbSettings = typeof TmdbSettings.infer;
