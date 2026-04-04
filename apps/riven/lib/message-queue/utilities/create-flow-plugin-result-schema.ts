import { type } from "arktype";

export const createPluginResultSchema = <T extends Record<string, unknown>>(
  resultSchema: type.Any<T & object>,
) =>
  type({
    "...": resultSchema,
    plugin: "string > 0",
  });
