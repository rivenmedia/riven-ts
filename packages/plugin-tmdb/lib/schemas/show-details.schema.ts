import z from "zod";

import { ShowExternalIds } from "./show-external-ids.schema.ts";

/**
 * The response of `tv/{id}?append_to_response=external_ids`
 */
export const ShowDetails = z.object({
  id: z.int(),
  name: z.string(),
  overview: z.string(),
  backdrop_path: z.string().nullable(),
  poster_path: z.string().nullable(),
  original_language: z.string(),
  first_air_date: z.string().nullish(),
  episode_run_time: z.array(z.int()),
  last_episode_to_air: z
    .object({
      runtime: z.int().nullable(),
    })
    .nullable(),
  genres: z.array(
    z.object({
      id: z.int(),
      name: z.string(),
    }),
  ),
  homepage: z.string().nullish(),
  status: z.string(),
  origin_country: z.array(z.string()),
  production_companies: z.array(
    z.object({
      id: z.int(),
      name: z.string(),
      logo_path: z.string().nullable(),
      origin_country: z.string(),
    }),
  ),
  spoken_languages: z.array(
    z.object({
      english_name: z.string(),
      iso_639_1: z.string(),
      name: z.string(),
    }),
  ),
  external_ids: ShowExternalIds,
});

export type ShowDetails = z.infer<typeof ShowDetails>;
