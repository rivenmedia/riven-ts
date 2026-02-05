import type { BaseDataSource } from "../datasource/index.ts";
import type { DataSourceConstructor } from "../schemas/index.ts";

export class DataSourceMap extends Map<
  DataSourceConstructor,
  BaseDataSource<Record<string, unknown>>
> {
  /**
   *
   * @param constructor The constructor of your DataSource class.
   * Ensure the class has been registered in the plugin's `dataSources` array, otherwise it will not be available in the map.
   *
   * @throws If the requested constructor could not be found.
   *
   * @returns The instance of the requested datasource.
   */
  override get<T extends DataSourceConstructor>(constructor: T) {
    const value = super.get(constructor);

    if (!value) {
      throw new Error(
        `DataSource for ${constructor.name} not found in DataSourceMap`,
      );
    }

    return value as InstanceType<T>;
  }
}
