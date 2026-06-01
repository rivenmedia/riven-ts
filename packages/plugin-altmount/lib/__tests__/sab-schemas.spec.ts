import assert from "node:assert";
import { describe, expect, it } from "vitest";

import { SabAddurlResponse } from "../schemas/sab-addurl-response.schema.ts";
import { SabHistoryResponse } from "../schemas/sab-history-response.schema.ts";
import { SabQueueResponse } from "../schemas/sab-queue-response.schema.ts";

describe("SabAddurlResponse", () => {
  it("parses a success response", () => {
    const result = SabAddurlResponse.safeParse({
      status: true,
      nzo_ids: ["SABnzbd_nzo_abc"],
    });
    assert(result.success && result.data.status);
    expect(result.data.nzo_ids).toEqual(["SABnzbd_nzo_abc"]);
  });

  it("parses an error response", () => {
    const result = SabAddurlResponse.safeParse({
      status: false,
      error: "API Key Incorrect",
    });
    assert(result.success && !result.data.status);
    expect(result.data.error).toBe("API Key Incorrect");
  });

  it("coerces numeric nzo_ids defensively", () => {
    const result = SabAddurlResponse.safeParse({
      status: true,
      nzo_ids: [12345, "SABnzbd_nzo_def"],
    });
    assert(result.success && result.data.status);
    expect(result.data.nzo_ids).toEqual(["12345", "SABnzbd_nzo_def"]);
  });

  it("rejects missing status discriminator", () => {
    const result = SabAddurlResponse.safeParse({ nzo_ids: ["x"] });
    expect(result.success).toBe(false);
  });
});

describe("SabQueueResponse", () => {
  it("parses a queue with one slot", () => {
    const result = SabQueueResponse.safeParse({
      queue: {
        slots: [
          {
            nzo_id: "SABnzbd_nzo_abc",
            status: "Downloading",
            percentage: "45",
            mb: "1024",
            mbleft: "512",
          },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it("parses an empty queue", () => {
    const result = SabQueueResponse.safeParse({ queue: { slots: [] } });
    expect(result.success).toBe(true);
  });

  it("coerces numeric percentage/mb fields", () => {
    const result = SabQueueResponse.safeParse({
      queue: {
        slots: [
          { nzo_id: "x", status: "Downloading", percentage: 45, mb: 1024 },
        ],
      },
    });
    assert(result.success);
    const slot = result.data.queue.slots[0];
    assert(slot);
    expect(slot.percentage).toBe("45");
    expect(slot.mb).toBe("1024");
  });
});

describe("SabHistoryResponse", () => {
  it("parses a Completed history slot", () => {
    const result = SabHistoryResponse.safeParse({
      history: {
        slots: [{ nzo_id: "x", status: "Completed", name: "Inception 2010" }],
      },
    });
    expect(result.success).toBe(true);
  });

  it("parses a Failed history slot with fail_message", () => {
    const result = SabHistoryResponse.safeParse({
      history: {
        slots: [
          {
            nzo_id: "x",
            status: "Failed",
            fail_message: "missing articles",
          },
        ],
      },
    });
    assert(result.success);
    const slot = result.data.history.slots[0];
    assert(slot);
    expect(slot.fail_message).toBe("missing articles");
  });

  it("accepts non-standard status strings (extended implementations)", () => {
    const result = SabHistoryResponse.safeParse({
      history: { slots: [{ nzo_id: "x", status: "Verifying" }] },
    });
    expect(result.success).toBe(true);
  });

  it("exposes storage, category and bytes from a real AltMount slot", () => {
    const result = SabHistoryResponse.safeParse({
      history: {
        slots: [
          {
            nzo_id: "Inception.2010.4K.HDR.DV.2160p.BDRemux.Ita.Eng.x265-NAHOM",
            name: "Inception.2010.4K.HDR.DV.2160p.BDRemux.Ita.Eng.x265-NAHOM",
            status: "Completed",
            storage: "/mnt/altmount/complete/Default",
            category: "Default",
            bytes: 69347000342,
          },
        ],
      },
    });
    assert(result.success);
    const slot = result.data.history.slots[0];
    assert(slot);
    expect(slot.storage).toBe("/mnt/altmount/complete/Default");
    expect(slot.category).toBe("Default");
    expect(slot.bytes).toBe(69347000342);
  });
});
