import { afterEach, vi } from "vitest";

afterEach(() => {
  // Restore real timers after each test to avoid side effects.
  vi.useRealTimers();
});
