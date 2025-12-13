import "reflect-metadata";

export async function register() {
  const { postgresDataSource } = await import("@repo/database/connection");

  await postgresDataSource.initialize();
}
