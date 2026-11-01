import z from "zod";

export const MovieCredits = z.object({
  id: z.int(),
  cast: z.array(
    z.object({
      adult: z.boolean(),
      gender: z.int(),
      id: z.int(),
      known_for_department: z.string(),
      name: z.string(),
      original_name: z.string(),
      popularity: z.number(),
      profile_path: z.string().nullable(),
      cast_id: z.int(),
      character: z.string(),
      credit_id: z.string(),
      order: z.int(),
    }),
  ),
  crew: z.array(
    z.object({
      adult: z.boolean(),
      gender: z.int(),
      id: z.int(),
      known_for_department: z.string(),
      name: z.string(),
      original_name: z.string(),
      popularity: z.number(),
      profile_path: z.string().nullable(),
      credit_id: z.string(),
      department: z.string(),
      job: z.string(),
    }),
  ),
});
