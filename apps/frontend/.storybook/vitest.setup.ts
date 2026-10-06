import { configureLocale } from "@/lib/utils/configure-luxon";

import { faker } from "@faker-js/faker";
import { DateTime, Settings } from "luxon";
import { beforeEach, vi } from "vitest";

configureLocale("en-GB");

const baseDate = DateTime.fromObject({ year: 2026, month: 8, day: 26 });

Settings.now = () => baseDate.toMillis();

faker.seed(42);
faker.setDefaultRefDate(baseDate.toJSDate());

export class MemoryStorage implements Storage {
  readonly #items = new Map<string, string>();

  public get length() {
    return this.#items.size;
  }

  public clear() {
    this.#items.clear();
  }

  public getItem(key: string) {
    return this.#items.get(key) ?? null;
  }

  public key(index: number) {
    return [...this.#items.keys()][index] ?? null;
  }

  public removeItem(key: string) {
    this.#items.delete(key);
  }

  public setItem(key: string, value: string) {
    this.#items.set(key, value);
  }
}

// Test files run concurrently in iframes on the same origin, so isolate storage to prevent
// stories leaking state into one another (e.g. the theme switcher tests changing the persisted theme)
for (const storage of ["localStorage", "sessionStorage"] as const) {
  vi.stubGlobal(storage, new MemoryStorage());
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
