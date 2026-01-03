import { afterEach, vi } from "vitest";

afterEach(() => {
  // Restore real timers after each test to avoid side effects.
  vi.useRealTimers();

  // Restore all mocks/spies after each test to avoid interference.
  vi.restoreAllMocks();
});
