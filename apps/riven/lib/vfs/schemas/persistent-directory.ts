import z from "zod";

export const persistentDirectorySchema = z.enum(["movies", "shows"]);
