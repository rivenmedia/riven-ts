try {
  process.loadEnvFile(".env.riven");
} catch {
  throw new Error(
    "Riven environment file must be present to use the MikroORM CLI",
  );
}

const { createDatabaseConfig } = await import("./lib/database/config.ts");

export default createDatabaseConfig();
