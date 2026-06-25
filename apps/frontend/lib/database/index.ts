import { privateEnvironment } from "@/environment/private-environment.schema";

import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema/index.ts";

export const orm = drizzle(privateEnvironment.DATABASE_FILE_NAME, {
  schema,
  logger: privateEnvironment.DATABASE_LOGGING,
});
