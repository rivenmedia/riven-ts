// Importing the resolver graph eagerly constructs the core Settings object,
// which throws when the required RIVEN_SETTING__* values are absent. Emitting
// the schema needs only the resolver types, so set harmless placeholders here;
// real values come from the runtime env_file.
process.env.RIVEN_SETTING__databaseUrl ??=
  "postgresql://build:build@localhost:5432/build";
process.env.RIVEN_SETTING__redisUrl ??= "redis://localhost:6379";
process.env.RIVEN_SETTING__vfsMountPath ??= "/mnt/riven";

const { buildSchema } = await import("@repo/core-util-graphql-schema");
const { resolvers } = await import("../lib/graphql/resolvers/index.ts");

await buildSchema({
  resolvers,
  emitSchemaFile: "schema.graphql",
});
