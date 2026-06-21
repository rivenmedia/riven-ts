import { defineConfig } from "drizzle-kit";

import "dotenv/config";

const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
  console.warn(
    "DATABASE_URL environment variable is not set. Please set it in your .env file or environment variables.",
  );
}

export default defineConfig({
  dialect: "sqlite",
  schema: process.env["DRIZZLE_SCHEMA_PATH"] ?? "./src/lib/server/schema",
  out: process.env["DRIZZLE_MIGRATIONS_PATH"] ?? "./src/lib/server/migrations",
  dbCredentials: {
    url: databaseUrl ?? "",
  },
});
