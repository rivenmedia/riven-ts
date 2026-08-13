import { Module } from "@nestjs/common";

import { CacheModule } from "./cache/cache.module.ts";
import { DatabaseModule } from "./database/database.module.ts";
import { GraphQLModule } from "./graphql/graphql.module.ts";
import { LoggingModule } from "./logging/logging.module.ts";
import { MessageQueueModule } from "./message-queue/message-queue.module.ts";
import { SettingsModule } from "./settings/settings.module.ts";

/**
 * The root Nest module for Riven.
 *
 * Feature modules are added here as the migration progresses.
 */
@Module({
  imports: [
    SettingsModule,
    LoggingModule,
    CacheModule,
    DatabaseModule,
    MessageQueueModule,
    GraphQLModule,
  ],
})
export class AppModule {}
