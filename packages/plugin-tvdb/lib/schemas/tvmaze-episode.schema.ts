import { type } from "arktype";

export const TvMazeEpisode = type({
  airstamp: "string.date.iso",
});

export type TvMazeEpisode = typeof TvMazeEpisode.infer;
