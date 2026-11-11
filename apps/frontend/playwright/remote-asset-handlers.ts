import { HttpResponse } from "msw";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { createRemoteAssetHandlers } from "#mocks/handlers/remote-assets.shared.ts";

const fixturesDirectory = path.join(
  import.meta.dirname,
  "../mocks/remote-assets",
);

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

/** Serves remote images and fonts from their local copies in `mocks/remote-assets` */
export const remoteAssetHandlers = createRemoteAssetHandlers(
  async (fixturePath) => {
    const filePath = path.join(fixturesDirectory, fixturePath);

    // Guard against paths that escape the fixtures directory
    if (!filePath.startsWith(fixturesDirectory + path.sep)) {
      return undefined;
    }

    try {
      const body = await readFile(filePath);

      return new HttpResponse(body, {
        headers: {
          "Content-Type":
            contentTypes[path.extname(filePath)] ?? "application/octet-stream",
        },
      });
    } catch {
      return undefined;
    }
  },
);
