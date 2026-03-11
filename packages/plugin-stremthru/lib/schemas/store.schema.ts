import z from "zod";

export const Store = z.enum(["realdebrid"]);

export type Store = z.infer<typeof Store>;
