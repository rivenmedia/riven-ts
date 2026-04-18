import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { TorrentioSettings } from "./types/torrentio-settings.type.ts";

@Resolver(() => Settings)
export class TorrentioSettingsResolver {
  @FieldResolver(() => TorrentioSettings)
  torrentio(): TorrentioSettings {
    return {
      apiKey: "torrentio-api-key",
    };
  }
}
