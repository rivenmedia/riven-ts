import { type } from "arktype";

export const MdbListSettings = type({
  apiKey: type("string > 0").describe("Your MdbList API Key"),
  lists: type("string.json.parse")
    .to("(string > 0)[]")
    .describe("List of MdbList lists to request")
    .default("[]"),
});

export type MdbListSettings = typeof MdbListSettings.infer;
