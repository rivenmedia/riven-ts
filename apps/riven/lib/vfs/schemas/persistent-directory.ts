import z from "zod";

export const PersistentDirectory = z.enum(["movies", "shows"]);

export type PersistentDirectory = z.infer<typeof PersistentDirectory>;
