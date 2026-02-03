import z from "zod";

export const TmdbSettings = z.object({});

export type TmdbSettings = z.infer<typeof TmdbSettings>;
