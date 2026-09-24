import z from "zod";

export const MediaItemType = z.enum(["movie", "show", "season", "episode"]);

export type MediaItemType = z.infer<typeof MediaItemType>;
