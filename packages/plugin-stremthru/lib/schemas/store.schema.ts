import { z } from "@rivenmedia/plugin-sdk/validation";

export const Store = z.enum([
  "alldebrid",
  "debrider",
  "debridlink",
  "easydebrid",
  "offcloud",
  "pikpak",
  "premiumize",
  "realdebrid",
  "torbox",
]);

export type Store = z.infer<typeof Store>;
