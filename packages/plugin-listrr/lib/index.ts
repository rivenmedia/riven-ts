import {
  ListrrAPI,
  type ListrrContextSlice,
} from "./datasource/listrr.datasource.ts";
import { ListrrResolver } from "./schema/listrr.resolver.ts";

export const resolvers = [ListrrResolver] as const;

export const datasource = ListrrAPI;

export type ContextSlice = ListrrContextSlice;
