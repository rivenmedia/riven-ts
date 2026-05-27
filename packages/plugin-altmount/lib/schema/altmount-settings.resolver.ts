import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { AltmountSettings } from "./types/altmount-settings.type.ts";

@Resolver(() => Settings)
export class AltmountSettingsResolver {
  @FieldResolver(() => AltmountSettings)
  altmount(): AltmountSettings {
    return {
      altmountUrl: "http://altmount:8081",
      altmountApiKey: "altmount-api-key",
      pollIntervalMs: 10_000,
      pollTimeoutMs: 30 * 60 * 1000,
    };
  }
}
