import { expect, it } from "vitest";

import { DataSourceMap } from "./datasource-map.ts";

import type { BaseDataSource } from "../datasource/index.ts";
import type { DataSourceConstructor } from "../schemas/index.ts";

class RegisteredAPI {
  public readonly label = "registered";
}
class UnregisteredAPI {
  public readonly label = "unregistered";
}

it("returns the instance of a registered data source", () => {
  const instance = {} as BaseDataSource<Record<string, unknown>>;
  const map = new DataSourceMap([
    [RegisteredAPI as unknown as DataSourceConstructor, instance],
  ]);

  expect(map.get(RegisteredAPI as unknown as DataSourceConstructor)).toBe(
    instance,
  );
});

it("throws for a data source that was not registered", () => {
  const map = new DataSourceMap();

  expect(() =>
    map.get(UnregisteredAPI as unknown as DataSourceConstructor),
  ).toThrow("DataSource for UnregisteredAPI not found in DataSourceMap");
});
