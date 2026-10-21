import z from "zod";

/**
 * The response of `tv/{id}/aggregate_credits`.
 *
 * This call differs from the main credits call in that it does not return the newest season.
 * Instead, it is a view of all the entire cast & crew for all episodes belonging to a TV show.
 */
export const ShowAggregateCredits = z.object({
  id: z.int(),
  cast: z.array(
    z.object({
      id: z.int(),
      name: z.string(),
      profile_path: z.string().nullable(),
      total_episode_count: z.int(),
      order: z.int(),
      roles: z.array(
        z.object({
          character: z.string(),
          episode_count: z.int(),
        }),
      ),
    }),
  ),
});
