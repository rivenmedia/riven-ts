import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { NotificationsSettings } from "./types/notifications-settings.type.ts";

@Resolver(() => Settings)
export class NotificationsSettingsResolver {
  @FieldResolver(() => NotificationsSettings)
  notifications(): NotificationsSettings {
    return {
      urls: [],
    };
  }
}
