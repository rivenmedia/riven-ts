import { describe, expect, vi } from "vitest";
import { toPromise } from "xstate";

import { logger } from "#utilities/logger/logger.ts";

import { it } from "./helpers/test-context.ts";

function expectRoutedPluginError(errorSpy: ReturnType<typeof vi.spyOn>) {
  expect(errorSpy).toHaveBeenCalledWith(
    "Failed to collect plugins for registration.",
    { err: expect.any(Error) as Error },
  );

  expect(errorSpy).toHaveBeenCalledWith(
    "Failed to register plugins during bootstrap.",
    { err: expect.any(Error) as Error },
  );
}

describe("when plugins cannot be collected", () => {
  it("fails bootstrap when stored settings fail to load", async ({
    actor,
    services,
  }) => {
    vi.spyOn(
      services.settingsService,
      "getStoredValuesByNamespace",
    ).mockRejectedValue(new Error("Database unavailable"));

    const errorSpy = vi.spyOn(logger, "error");

    await expect(toPromise(actor.start())).rejects.toThrow(
      "Database unavailable",
    );

    expectRoutedPluginError(errorSpy);
  });

  // Runs last: the package.json mock is not undone for later tests in this file.
  it("fails bootstrap when two plugins share a section id", async ({
    actor,
  }) => {
    vi.doMock(
      import("#package.json"),
      () =>
        ({
          default: {
            name: "riven",
            version: "1.0.0-mock",
            dependencies: {
              "@repo/plugin-a1": "workspace:^",
              "@repo/plugin-a-1": "workspace:^",
            },
          },
        }) as never,
    );

    const errorSpy = vi.spyOn(logger, "error");

    await expect(toPromise(actor.start())).rejects.toThrow(
      'both resolve to the settings section id "repo-plugin-a-1"',
    );

    expectRoutedPluginError(errorSpy);
  });
});
