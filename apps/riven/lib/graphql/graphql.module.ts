import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database/database.module.ts";
import { resolvers } from "./resolvers/index.ts";

/**
 * Registers the core GraphQL resolvers with the DI container.
 *
 * The schema itself is still assembled by the bootstrap state machine, which
 * merges these resolvers with those contributed by plugins. This module only
 * makes the core resolvers resolvable, so that the type-graphql container can
 * hand them their dependencies.
 */
@Module({
  imports: [DatabaseModule],
  providers: [...resolvers],
  exports: [...resolvers],
})
export class GraphQLModule {}
