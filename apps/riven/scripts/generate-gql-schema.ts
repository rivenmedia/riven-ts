/**
 * Emits the GraphQL schema definition.
 *
 * Resolvers now take their dependencies through the DI container, so importing
 * them pulls in the modules those dependencies live in, and the settings module
 * validates the environment as soon as it is imported. Schema generation only
 * reads resolver metadata and never opens a connection, so the few settings
 * that have no default are given placeholders when absent. Any real value in
 * the environment is left alone.
 */
const schemaGenerationPlaceholders = {
  RIVEN_SETTING__databaseUrl: "postgresql://schema-generation/riven",
  RIVEN_SETTING__redisUrl: "redis://schema-generation",
  RIVEN_SETTING__vfsMountPath: "/tmp/riven-schema-generation",
};

for (const [key, value] of Object.entries(schemaGenerationPlaceholders)) {
  process.env[key] ??= value;
}

// Imported dynamically so the placeholders above are set before the settings
// module is evaluated.
const { buildSchema } = await import("@repo/core-util-graphql-schema");
const { resolvers } = await import("../lib/graphql/resolvers/index.ts");

await buildSchema({
  resolvers,
  emitSchemaFile: "schema.graphql",
});
