import { faker } from "@faker-js/faker";
import { DateTime, Settings } from "luxon";

import { configureLocale } from "#lib/utils/configure-luxon.ts";

/**
 * Normalises the Storybook environment so that dates, times, and random data are consistent.
 */
export function normaliseEnvironment() {
  configureLocale("en-GB");

  const baseDate = DateTime.fromObject({ year: 2026, month: 8, day: 26 });

  Settings.now = () => baseDate.toMillis();

  faker.seed(42);
  faker.setDefaultRefDate(baseDate.toJSDate());
}
