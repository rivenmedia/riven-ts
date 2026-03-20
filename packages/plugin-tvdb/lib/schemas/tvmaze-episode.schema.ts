import z from "zod";

export const TvMazeEpisode = z.object({
  airstamp: z.iso.datetime({ offset: true }),
});

export type TvMazeEpisode = z.infer<typeof TvMazeEpisode>;
