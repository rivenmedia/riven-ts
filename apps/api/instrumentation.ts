import "reflect-metadata";

export async function register() {
  const { postgresDataSource } =
    await import("@repo/core-util-database/connection");

  await postgresDataSource.initialize();
}
