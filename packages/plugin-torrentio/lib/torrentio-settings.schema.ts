import { type } from "arktype";

export const TorrentioSettings = type({
  filter: type("string").default(
    "sort=qualitysize%7Cqualityfilter=threed,480p,scr,cam",
  ),
});

export type TorrentioSettings = typeof TorrentioSettings.infer;
