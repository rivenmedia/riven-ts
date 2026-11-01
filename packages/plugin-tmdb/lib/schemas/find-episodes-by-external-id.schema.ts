import z from "zod";

/**
 * The TV episode results of `find/{external_id}`.
 */
export const FindEpisodesByExternalId = z.object({
  tv_episode_results: z.array(
    z.object({
      show_id: z.int(),
      season_number: z.int(),
      episode_number: z.int(),
    }),
  ),
});
