import { json } from "@repo/util-plugin-sdk/validation";

import z from "zod";

export const ListrrSettings = z.object({
  apiKey: z.string().min(1, "Listrr API Key is required"),
  movieLists: json(z.array(z.string().min(1))),
});

export type ListrrSettings = typeof ListrrSettings;
