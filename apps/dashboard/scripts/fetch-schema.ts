/**
 * Produces ./schema.graphql for the dashboard's codegen pipeline.
 *
 * Two modes:
 *   - Static (default): invokes apps/riven#codegen:gql-schema, which builds
 *     SDL directly from type-graphql resolvers. No live server required —
 *     works on CI and in clean checkouts.
 *   - Live (opt-in): set RIVEN_SCHEMA_URL to introspect a running riven dev
 *     server. Useful when iterating on resolver changes that haven't landed
 *     in apps/riven yet.
 *
 * Usage:
 *   pnpm --filter @repo/dashboard codegen:schema
 *   RIVEN_SCHEMA_URL=http://localhost:3000 pnpm ... codegen:schema
 */
import {
  type IntrospectionQuery,
  buildClientSchema,
  getIntrospectionQuery,
  printSchema,
} from "graphql";
import { spawn } from "node:child_process";
import { copyFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ENV_VAR = "RIVEN_SCHEMA_URL";

const dashboardSchemaPath = resolve(
  fileURLToPath(new URL("../schema.graphql", import.meta.url)),
);
const rivenSchemaPath = resolve(
  fileURLToPath(new URL("../../riven/schema.graphql", import.meta.url)),
);

async function buildStatically(): Promise<void> {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(
      "pnpm",
      ["--filter", "@repo/riven", "codegen:gql-schema"],
      { stdio: "inherit" },
    );
    child.on("error", rejectPromise);
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        rejectPromise(
          new Error(
            `apps/riven codegen:gql-schema exited with status ${code ?? "(killed)"}`,
          ),
        );
      }
    });
  });

  await copyFile(rivenSchemaPath, dashboardSchemaPath);
  console.log(
    `Wrote ${dashboardSchemaPath} (built statically from apps/riven resolvers).`,
  );
}

async function fetchFromLiveServer(endpoint: string): Promise<void> {
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
        `Either start the riven dev server (\`pnpm --filter @repo/riven dev\`) or unset ${ENV_VAR} to fall back to the static generator.`,
        `Underlying error: ${reason}`,
      ].join("\n  "),
    );
  }

  if (!response.ok) {
    throw new Error(
      `Introspection request to ${endpoint} failed with HTTP ${response.status} ${response.statusText}.`,
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
  await writeFile(dashboardSchemaPath, `${sdl}\n`, "utf8");
  console.log(`Wrote ${dashboardSchemaPath} (introspected ${endpoint}).`);
}

const liveEndpoint = process.env[ENV_VAR];

const task = liveEndpoint
  ? fetchFromLiveServer(liveEndpoint)
  : buildStatically();

task.catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n[codegen:schema] ${message}\n`);
  process.exitCode = 1;
});
