import { json, type } from "@repo/util-plugin-sdk/validation";

export const MdbListSettings = type({
  apiKey: type("string > 0").describe("Your MdbList API Key"),
  lists: json(z.array(z.string().min(1)))
    .default([])
    .describe("List of MdbList lists to request"),
});

export type MdbListSettings = z.infer<typeof MdbListSettings>;
