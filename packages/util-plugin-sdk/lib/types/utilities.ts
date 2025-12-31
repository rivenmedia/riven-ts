import type {
  BaseDataSource,
  BaseDataSourceConfig,
} from "../datasource/index.ts";
import type { Constructor } from "type-fest";

export class DataSourceMap extends Map<
  Constructor<BaseDataSource, [BaseDataSourceConfig]>,
  BaseDataSource
> {
  override get<T extends BaseDataSource>(
    ctor: Constructor<T, [BaseDataSourceConfig]>,
  ) {
    const value = super.get(ctor);

    if (!value) {
      throw new Error(`DataSource for ${ctor.name} not found in DataSourceMap`);
    }

    if (!(value instanceof ctor)) {
      throw new Error(
        `DataSource for ${ctor.name} is not an instance of the expected constructor`,
      );
    }

    return value;
  }
}
