import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { TorrentioSettings } from "./types/torrentio-settings.type.ts";

@Resolver((_of) => Settings)
export class TorrentioSettingsResolver {
  @FieldResolver((_returns) => TorrentioSettings)
  torrentio(): TorrentioSettings {
    return {
      apiKey: "torrentio-api-key",
    };
  }
}
