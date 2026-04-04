import { type } from "arktype";

export const ListrrSettings = type({
  apiKey: type("string > 0").describe("Your Listrr API Key"),
  movieLists: type("string.json.parse")
    .to("(string > 0)[]")
    .describe("List of Listrr movie lists to request")
    .default("[]"),
  showLists: type("string.json.parse")
    .to("(string > 0)[]")
    .describe("List of Listrr show lists to request")
    .default("[]"),
});

export type ListrrSettings = typeof ListrrSettings.infer;
