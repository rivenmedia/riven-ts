import z from "zod";

export const TvdbSettings = z.object({});

export type TvdbSettings = z.infer<typeof TvdbSettings>;
