import { type ZodObject, z } from "zod";

/**
 * A class to manage and retrieve plugin settings based on provided Zod schemas.
 */
export class PluginSettings {
  #settingsMap = new Map<ZodObject, unknown>();
  #locked = false;

  /**
   * Locks the settings to prevent further modifications.
   */
  lock() {
    this.#locked = true;
  }

  /**
   * Persists settings for a given schema.
   *
   * @param schema The schema that was used to create the value
   * @param value The parsed value of the schema
   * @throws {Error} if settings are locked
   */
  set<T extends ZodObject>(schema: T, value: z.infer<T>): void {
    if (this.#locked) {
      throw new Error("Settings are locked and cannot be modified.");
    }

    this.#settingsMap.set(schema, value);
  }

  /**
   * Retrieves the evaluated plugin settings object.
   *
   * @param schema The Zod schema used to parse the settings.
   * @returns The parsed settings for the provided schema.
   */
  get<T extends ZodObject>(schema: T): z.infer<T> {
    if (!this.#settingsMap.has(schema)) {
      throw new Error("Schema not found in settings map.");
    }

    return this.#settingsMap.get(schema) as z.infer<T>;
  }
}
