import pg from "pg";

/** Creates the database `name` on the server at `postgresUrl`, unless it already exists */
export async function ensureDatabase(postgresUrl: string, name: string) {
  const client = new pg.Client({ connectionString: postgresUrl });

  await client.connect();

  try {
    const { rowCount } = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [name],
    );

    if (!rowCount) {
      // oxlint-disable-next-line sonarjs/sql-queries -- the name is escaped, and identifiers can't be parameters
      await client.query(`CREATE DATABASE ${client.escapeIdentifier(name)}`);
    }
  } finally {
    await client.end();
  }
}
