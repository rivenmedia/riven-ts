import type {
  BaseDataSource,
  BaseDataSourceConfig,
} from "../datasource/index.ts";
import type { Constructor } from "type-fest";

export type DataSourceMap = Omit<
  Map<Constructor<BaseDataSource, [BaseDataSourceConfig]>, BaseDataSource>,
  "get"
> & {
  get: <T extends BaseDataSource>(
    ctor: Constructor<T, [BaseDataSourceConfig]>,
  ) => T;
};
