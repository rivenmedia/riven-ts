import { type } from "arktype";

export const Store = type.enumerated(
  "alldebrid",
  "debrider",
  "debridlink",
  "easydebrid",
  "offcloud",
  "pikpak",
  "premiumize",
  "realdebrid",
  "torbox",
);

export type Store = typeof Store.infer;
