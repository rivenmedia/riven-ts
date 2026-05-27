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
    expect(result.success).toBe(true);
    if (result.success && result.data.status === true) {
      expect(result.data.nzo_ids).toEqual(["SABnzbd_nzo_abc"]);
    }
  });

  it("parses an error response", () => {
    const result = SabAddurlResponse.safeParse({
      status: false,
      error: "API Key Incorrect",
    });
    expect(result.success).toBe(true);
    if (result.success && result.data.status === false) {
      expect(result.data.error).toBe("API Key Incorrect");
    }
  });

  it("coerces numeric nzo_ids defensively", () => {
    const result = SabAddurlResponse.safeParse({
      status: true,
      nzo_ids: [12345, "SABnzbd_nzo_def"],
    });
    expect(result.success).toBe(true);
    if (result.success && result.data.status === true) {
      expect(result.data.nzo_ids).toEqual(["12345", "SABnzbd_nzo_def"]);
    }
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
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.queue.slots[0]!.percentage).toBe("45");
      expect(result.data.queue.slots[0]!.mb).toBe("1024");
    }
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
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.history.slots[0]!.fail_message).toBe(
        "missing articles",
      );
    }
  });

  it("accepts non-standard status strings (extended implementations)", () => {
    const result = SabHistoryResponse.safeParse({
      history: { slots: [{ nzo_id: "x", status: "Verifying" }] },
    });
    expect(result.success).toBe(true);
  });
});
