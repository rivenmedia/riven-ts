import { Migrator } from "@mikro-orm/migrations";
import z from "zod";

const { createDatabaseConfig } = await import("./database/config.ts");

const cliContexts = z.enum(["default", "slim"]);

export default async (contextName: string) => {
  const context = cliContexts.safeParse(contextName);

  if (!context.success) {
    throw new Error(
      `Unknown MikroORM CLI context: ${contextName}. Valid contexts are: ${cliContexts.options.join(
        ", ",
      )}`,
    );
  }

  switch (context.data) {
    // The "slim" context is used for CLI commands that don't require
    // a database connection, such as `mikro-orm cache:generate`
    case "slim": {
      return createDatabaseConfig({
        dbName: ":memory:",
        debug: true,
      });
    }

    case "default": {
      if (!process.env["CI"]) {
        try {
          process.loadEnvFile(".env.riven");
        } catch {
          throw new Error(
            "Riven environment file must be present to use database-aware MikroORM CLI methods. See `.env.riven.example` for reference.",
          );
        }
      }

      const databaseUrl = z
        .url()
        .parse(process.env["RIVEN_SETTING__databaseUrl"]);

      return createDatabaseConfig({
        clientUrl: databaseUrl,
        debug: true,
        extensions: [Migrator],
      });
    }
  }
};
