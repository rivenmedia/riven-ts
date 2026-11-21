import { expect, it, vi } from "vitest";

import { formatCurrency } from "./format-currency.ts";

it.for([
  ["en-US", 1234.5, "USD", "$1,234.50"],
  ["en-GB", 1234.5, "GBP", "£1,234.50"],
  ["de-DE", 1234.5, "EUR", "1.234,50\u00A0€"],
] as const)(
  "formats the amount in the browser's %s locale",
  ([language, amount, currency, expected]) => {
    vi.spyOn(navigator, "language", "get").mockReturnValue(language);

    expect(formatCurrency(amount, currency)).toBe(expected);
  },
);
