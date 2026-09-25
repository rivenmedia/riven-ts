// oxlint-disable-next-line import/no-unassigned-import
import "@testing-library/jest-dom/vitest";
import { Settings } from "luxon";
import { vi } from "vitest";

Settings.defaultLocale = "en-GB";

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
