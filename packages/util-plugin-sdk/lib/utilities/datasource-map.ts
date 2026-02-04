import type { BaseDataSource } from "../datasource/index.ts";
import type { DataSourceConstructor } from "../schemas/index.ts";

export class DataSourceMap extends Map<
  DataSourceConstructor,
  BaseDataSource<Record<string, unknown>>
> {
  override get<T extends DataSourceConstructor>(constructor: T) {
    const value = super.get(constructor);

    if (!value) {
      throw new Error(
        `DataSource for ${constructor.name} not found in DataSourceMap`,
      );
    }

    if (!(value instanceof constructor)) {
      throw new Error(
        `DataSource for ${constructor.name} is not an instance of the expected constructor`,
      );
    }

    return value as InstanceType<T>;
  }
}
