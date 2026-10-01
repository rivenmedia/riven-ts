import { faker } from "@faker-js/faker";
import { screenshot } from "@storycap-testrun/browser";
import { page } from "@vitest/browser/context";
import { DateTime, Settings } from "luxon";
import { afterEach, beforeEach } from "vitest";

const baseDate = DateTime.fromObject({ year: 2026, month: 8, day: 26 });

Settings.now = () => baseDate.toMillis();

faker.seed(42);

// Sizes the iframe while the test body runs. The captured image uses the
// storycap plugin's viewport option instead.
beforeEach(async () => {
  await page.viewport(1280, 720);
});

afterEach(async (context) => {
  await screenshot(page, context);
});
