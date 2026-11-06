import { BaseDataSource, DataSourceHTTPError } from "@repo/util-plugin-sdk";

import path from "node:path";

import { ScanCapabilitiesResponse } from "../schemas/scan-capabilities-response.schema.ts";
import { ScanStartResponse } from "../schemas/scan-start-response.schema.ts";

import type { SiloSettings } from "../silo-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";

class SiloAPIError extends Error {
  public override name = "SiloAPIError";
}

/**
 * Explanations for the error statuses documented for `POST /api/v2/scan`.
 *
 * The response body (an RFC 9457 problem document) is not passed through by `BaseDataSource`,
 * so the status code is the most specific information available.
 */
const scanErrorReasons: Partial<Record<number, string>> = {
  400: "the path is not inside a Silo library, does not exist, or cannot be read by Silo",
  401: "the API key is missing, invalid or expired",
  403: "the API key does not belong to an administrator",
  404: "the library does not exist",
  409: "the library is disabled",
  503: "the Silo scanner is not available",
};

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

  public async scanPath(subPath: string) {
    const scanPath = path.join(this.settings.siloLibraryPath, subPath);

    try {
      const response = await this.post<unknown>("api/v2/scan", {
        body: { path: scanPath },
      });

      const { mode, library_id: libraryId } = ScanStartResponse.parse(response);

      this.logger.debug(
        `Silo accepted ${mode} scan of ${scanPath} in library ${libraryId}`,
      );
    } catch (error) {
      const reason =
        error instanceof DataSourceHTTPError
          ? (scanErrorReasons[error.response.status] ?? error.message)
          : (error as Error).message;

      throw new SiloAPIError(`Failed to scan ${scanPath}: ${reason}`, {
        cause: error,
      });
    }
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
