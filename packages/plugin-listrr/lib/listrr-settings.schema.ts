import { json } from "@repo/util-plugin-sdk/validation";

import { type } from "arktype";

export const ListrrSettings = type({
  apiKey: type("string > 0").describe("Your Listrr API Key"),
  movieLists: json(z.array(z.string().min(1)))
    .default([])
    .describe("List of Listrr movie lists to request"),
  showLists: json(z.array(z.string().min(1)))
    .default([])
    .describe("List of Listrr show lists to request"),
});

export type ListrrSettings = z.infer<typeof ListrrSettings>;
