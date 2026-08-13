import { Module } from "@nestjs/common";

import { CacheModule } from "./cache/cache.module.ts";
import { LoggingModule } from "./logging/logging.module.ts";
import { SettingsModule } from "./settings/settings.module.ts";

/**
 * The root Nest module for Riven.
 *
 * Feature modules are added here as the migration progresses.
 */
@Module({
  imports: [SettingsModule, LoggingModule, CacheModule],
})
export class AppModule {}
