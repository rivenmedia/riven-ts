import { type } from "arktype";

import { Store } from "./schemas/store.schema.ts";

export const StoreKeys = type<Record<`${Store}ApiKey?`, "string">>({
  "realdebridApiKey?": "string",
  "alldebridApiKey?": "string",
  "debriderApiKey?": "string",
  "debridlinkApiKey?": "string",
  "easydebridApiKey?": "string",
  "offcloudApiKey?": "string",
  "pikpakApiKey?": "string",
  "premiumizeApiKey?": "string",
  "torboxApiKey?": "string",
});

export type StoreKeys = typeof StoreKeys.infer;

export const StremThruSettings = type({
  stremThruUrl: type("string.url")
    .describe("The URL of the StremThru instance to request")
    .default("https://stremthru.13377001.xyz/"),
}).merge(StoreKeys);

export type StremThruSettings = typeof StremThruSettings.infer;
