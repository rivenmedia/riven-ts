import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

import { privateEnvironment } from "../environment/private-environment.schema";

export const auth = betterAuth({
  database: new Database(privateEnvironment.DATABASE_URL),
});
