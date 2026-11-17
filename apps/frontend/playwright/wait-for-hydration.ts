import { expect } from "@playwright/test";

import type { Locator } from "@playwright/test";

/**
 * Waits for React to hydrate the given element, so interacting with it isn't lost.
 *
 * Server-rendered elements are visible (and so clickable) before React attaches their event handlers. A click
 * before then does nothing, which happens most under `next dev`, where hydration is slow.
 *
 * @note This relies on React's internal `__reactFiber` property, which it adds to elements it has hydrated
 */
export const waitForHydration = async (locator: Locator) => {
  await expect
    .poll(
      () =>
        locator.evaluate((element) =>
          Object.keys(element).some((key) => key.startsWith("__reactFiber")),
        ),
      { message: "Wait for React to hydrate the element" },
    )
    .toBe(true);
};
