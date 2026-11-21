import { expect, it as baseIt, vi } from "vitest";

import { formatCurrency } from "./format-currency.ts";

const it = baseIt.extend(
  "spyOnNavigatorLanguage",
  () => () => vi.spyOn(navigator, "language", "get"),
);

it.for([
  ["en-US", 1234.5, "USD", "$1,234.50"],
  ["en-GB", 1234.5, "GBP", "£1,234.50"],
  ["de-DE", 1234.5, "EUR", "1.234,50\u00A0€"],
] as const)(
  "formats the amount in the browser's %s locale",
  ([language, amount, currency, expected], { spyOnNavigatorLanguage }) => {
    spyOnNavigatorLanguage().mockReturnValue(language);

    expect(formatCurrency(amount, currency)).toBe(expected);
  },
);
