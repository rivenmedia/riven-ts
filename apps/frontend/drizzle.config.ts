import "dotenv/config";

import { defineConfig } from "drizzle-kit";
import z from "zod";

import { PrivateEnvironment } from "./environment/private-environment.schema";

const { DATABASE_FILE_NAME, DRIZZLE_MIGRATIONS_PATH, DRIZZLE_SCHEMA_PATH } =
  PrivateEnvironment.pick({
    DATABASE_FILE_NAME: true,
  })
    .extend({
      DRIZZLE_SCHEMA_PATH: z.string().default("./lib/database/schema"),
      DRIZZLE_MIGRATIONS_PATH: z.string().default("./lib/database/migrations"),
    })
    .parse(process.env);

export default defineConfig({
  dialect: "sqlite",
  schema: DRIZZLE_SCHEMA_PATH,
  out: DRIZZLE_MIGRATIONS_PATH,
  dbCredentials: {
    url: DATABASE_FILE_NAME,
  },
});
