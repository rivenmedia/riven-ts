import { database } from "../../database/database.ts";

export const getShowsDirectoryEntries = async (): Promise<string[]> => {
  const entries = await database.show.findAll();

  return entries.reduce<string[]>((acc, entry) => {
    if (!entry.prettyName) {
      return acc;
    }

    return [...acc, entry.prettyName];
  }, []);
};
