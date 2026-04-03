import "@repo/util-plugin-sdk/dto/entities";

import type { Services } from "../../../database/database.ts";
import type { Promisable } from "type-fest";

type WithORMCallback<T> = (database: Services) => Promisable<T>;

/**
 * NodeJS worker threads don't have access to the database connection established in the main thread,
 * so this utility function establishes a new connection for the duration of the callback and ensures it's properly closed afterwards.
 *
 * @param callback The callback to run. Will be provided with the ORM.
 * @returns The return value of the callback.
 */
export async function withORM<T>(callback: WithORMCallback<T>): Promise<T> {
  const { initORM, database: existingDatabase } =
    await import("../../../database/database.ts");

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (existingDatabase) {
    return await callback(existingDatabase);
  }

  const { databaseConfig } = await import("../../../database/config.ts");

  const database = await initORM(databaseConfig);

  try {
    return await callback(database);
  } finally {
    await database.orm.close();
  }
}
