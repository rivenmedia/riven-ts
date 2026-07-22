import { BaseDataSource } from "@repo/util-plugin-sdk";

export class TestAPI extends BaseDataSource<Record<string, unknown>> {
  public override baseURL = "https://test.com/api/";
  public override serviceName = "Test";

  public override async validate() {
    try {
      // Implement your own validation logic here
      await this.get("validate");

      return true;
    } catch {
      return false;
    }
  }
}
