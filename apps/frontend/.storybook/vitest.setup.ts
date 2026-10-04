import { configureLocale } from "@/lib/utils/configure-luxon";

import { faker } from "@faker-js/faker";
import { screenshot } from "@storycap-testrun/browser";
import { page } from "@vitest/browser/context";
import { DateTime, Settings } from "luxon";
import { afterEach, beforeEach, vi } from "vitest";

// Set by `@storybook/addon-vitest` when running stories as tests
declare module "vitest" {
  interface TaskMeta {
    storyId?: string;
  }

  interface TestContext {
    story?: { id: string };
  }
}

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

/** Waits for images in the viewport to load, as remote images may not have loaded by the time the page is stable */
const waitForVisibleImages = async () => {
  const pendingImages = [...document.images].filter((image) => {
    const { bottom, right, top, left } = image.getBoundingClientRect();

    return (
      !image.complete &&
      bottom > 0 &&
      right > 0 &&
      top < globalThis.innerHeight &&
      left < globalThis.innerWidth
    );
  });

  await Promise.race([
    Promise.allSettled(pendingImages.map((image) => image.decode())),
    new Promise((resolve) => {
      setTimeout(resolve, 10_000);
    }),
  ]);
};

// Test files run concurrently in iframes on the same origin, so isolate storage to prevent
// stories leaking state into one another (e.g. the theme switcher tests changing the persisted theme)
for (const storage of ["localStorage", "sessionStorage"] as const) {
  vi.stubGlobal(storage, new MemoryStorage());
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(async (context) => {
  // Story tests created with `Story.test()` share the parent story's ID and would overwrite its screenshot.
  // Only the story itself is captured; interaction tests are covered by the component test assertions.
  if (context.task.meta.storyId !== context.story?.id) {
    return;
  }

  await screenshot(page, context, {
    hooks: [
      // Runs once the page has stabilised at the screenshot viewport size, immediately before capturing
      { preCapture: waitForVisibleImages },
    ],
  });
});
