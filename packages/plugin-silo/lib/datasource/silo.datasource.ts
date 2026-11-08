import { BaseDataSource } from "@repo/util-plugin-sdk";

import { ScanCapabilitiesResponse } from "../schemas/scan-capabilities-response.schema.ts";

import type { SiloSettings } from "../silo-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";

export class SiloAPI extends BaseDataSource<SiloSettings> {
  public override baseURL = this.settings.siloServerUrl;
  public override serviceName = "Silo";

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ): void {
    requestOpts.headers["authorization"] = `Bearer ${this.settings.siloApiKey}`;
    requestOpts.headers["accept"] = "application/json";
  }

  public override async validate() {
    try {
      const response = await this.get<unknown>("api/v2/scan/capabilities");
      const { state, allowed } = ScanCapabilitiesResponse.parse(response);

      if (state !== "available") {
        this.logger.error(
          `Silo scanning is not available on ${this.settings.siloServerUrl} (state: ${state}).`,
        );

        return false;
      }

      if (allowed === false) {
        this.logger.error(
          "The Silo API key is not allowed to start scans. Please use an administrator's API key.",
        );

        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to connect to Silo server at ${this.settings.siloServerUrl}. Please check your settings. Error: ${(error as Error).message}`,
      );

      return false;
    }
  }
}
