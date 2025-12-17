import { ListrrAPI } from "@repo/listrr-data-access-api/data-source";

export interface Context {
  dataSources: {
    listrr: ListrrAPI;
  };
}
