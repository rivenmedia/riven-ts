import { BaseDataSource, type BasePluginContext } from "@repo/util-plugin-sdk";

export class TestAPIError extends Error {}

export class TestAPI extends BaseDataSource<Record<string, unknown>> {
  override baseURL = "https://test.com/api/";
  override serviceName = "Test";

  override async validate() {
    try {
      // Implement your own validation logic here
      await this.get("validate");

      return true;
    } catch {
      return false;
    }
  }
}

export type TestContextSlice = BasePluginContext;
