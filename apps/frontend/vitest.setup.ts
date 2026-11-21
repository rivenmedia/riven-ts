// oxlint-disable-next-line import/no-unassigned-import
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

import { configureLocale } from "#lib/utils/configure-luxon.ts";

configureLocale("en-GB");

// Tests for server code run in the Node environment, which has no window
if ("window" in globalThis) {
  Object.defineProperty(globalThis.window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
