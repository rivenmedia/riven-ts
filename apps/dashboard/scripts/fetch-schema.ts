/**
 * Introspects a running riven dev server and writes the SDL to ./schema.graphql.
 *
 * Usage:
 *   pnpm --filter @repo/dashboard codegen:schema
 *   RIVEN_SCHEMA_URL=http://localhost:3000 pnpm ... codegen:schema
 *
 * Pair this with `codegen:gql` to refresh generated TypeScript operation types.
 */
import {
  type IntrospectionQuery,
  buildClientSchema,
  getIntrospectionQuery,
  printSchema,
} from "graphql";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_URL = "http://localhost:3000";
const ENV_VAR = "RIVEN_SCHEMA_URL";

const endpoint = process.env[ENV_VAR] ?? DEFAULT_URL;

// schema.graphql lives at the dashboard package root, one level up from /scripts.
const outputPath = resolve(
  fileURLToPath(new URL("../schema.graphql", import.meta.url)),
);

async function fetchSchema(): Promise<void> {
  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        operationName: "IntrospectionQuery",
        query: getIntrospectionQuery(),
      }),
    });
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw new Error(
      [
        `Could not reach riven GraphQL endpoint at ${endpoint}.`,
        `Start the riven dev server (\`pnpm --filter @repo/riven dev\`) or set ${ENV_VAR} to a reachable URL.`,
        `Default is ${DEFAULT_URL} — matches riven's settings.gqlHost/settings.gqlPort.`,
        `Underlying error: ${reason}`,
      ].join("\n  "),
    );
  }

  if (!response.ok) {
    throw new Error(
      [
        `Introspection request to ${endpoint} failed with HTTP ${response.status} ${response.statusText}.`,
        `If the server is up, confirm introspection is enabled (NODE_ENV !== "production") and that ${ENV_VAR} points at the GraphQL path.`,
      ].join("\n  "),
    );
  }

  const payload = (await response.json()) as {
    data?: IntrospectionQuery;
    errors?: ReadonlyArray<{ message: string }>;
  };

  if (payload.errors && payload.errors.length > 0) {
    throw new Error(
      `Introspection returned GraphQL errors:\n  ${payload.errors
        .map((e) => e.message)
        .join("\n  ")}`,
    );
  }

  if (!payload.data) {
    throw new Error(
      `Introspection response from ${endpoint} contained no \`data\` field.`,
    );
  }

  const sdl = printSchema(buildClientSchema(payload.data));
  await writeFile(outputPath, `${sdl}\n`, "utf8");

  console.log(`Wrote schema (${sdl.length} chars) -> ${outputPath}`);
}

fetchSchema().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n[fetch-schema] ${message}\n`);
  process.exitCode = 1;
});
