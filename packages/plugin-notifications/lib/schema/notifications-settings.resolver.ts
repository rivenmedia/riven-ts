import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { NotificationsSettings } from "./types/notifications-settings.type.ts";

@Resolver((_of) => Settings)
export class NotificationsSettingsResolver {
  @FieldResolver((_returns) => NotificationsSettings)
  notifications(): NotificationsSettings {
    return {
      urls: [],
    };
  }
}
