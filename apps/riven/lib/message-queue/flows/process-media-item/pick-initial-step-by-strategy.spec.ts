import { describe, expect, it } from "vitest";

import { pickInitialStepByStrategy } from "./pick-initial-step-by-strategy.ts";

describe("pickInitialStepByStrategy", () => {
  it('returns "scrape" when strategy is "torrent"', () => {
    expect(pickInitialStepByStrategy("torrent")).toBe("scrape");
  });

  it('returns "nzb-scrape" when strategy is "nzb"', () => {
    expect(pickInitialStepByStrategy("nzb")).toBe("nzb-scrape");
  });

  it('returns "scrape" when strategy is undefined (fallback)', () => {
    expect(pickInitialStepByStrategy(undefined)).toBe("scrape");
  });
});
