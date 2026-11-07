import z from "zod";

const EpisodeCastMember = z.object({
  id: z.int(),
  name: z.string(),
  profile_path: z.string().nullable(),
  character: z.string(),
  order: z.int(),
});

/**
 * The response of `tv/{id}/season/{season_number}/episode/{episode_number}/credits`.
 */
export const EpisodeCredits = z.object({
  id: z.int(),
  cast: z.array(EpisodeCastMember),
  guest_stars: z.array(EpisodeCastMember),
});

export type EpisodeCredits = z.infer<typeof EpisodeCredits>;
