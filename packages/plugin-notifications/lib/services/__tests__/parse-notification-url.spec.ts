import { describe, expect, it } from "vitest";

import { parseNotificationUrl } from "../parse-notification-url.ts";

describe("parseNotificationUrl", () => {
  describe("discord", () => {
    it("parses a valid discord URL", () => {
      const result = parseNotificationUrl(
        "discord://1234567890/abcdefghijklmnop",
      );
      expect(result).toEqual({
        type: "discord",
        webhookId: "1234567890",
        webhookToken: "abcdefghijklmnop",
      });
    });

    it("throws on missing webhook token", () => {
      expect(() => parseNotificationUrl("discord://1234567890")).toThrow(
        "Invalid Discord URL",
      );
    });
  });

  describe("json", () => {
    it("parses a json:// URL as HTTPS", () => {
      const result = parseNotificationUrl("json://example.com/webhook");
      expect(result).toEqual({
        type: "json",
        url: "https://example.com/webhook",
      });
    });

    it("parses a jsons:// URL as HTTPS", () => {
      const result = parseNotificationUrl("jsons://example.com/webhook");
      expect(result).toEqual({
        type: "json",
        url: "https://example.com/webhook",
      });
    });

    it("preserves port in json URL", () => {
      const result = parseNotificationUrl("json://example.com:8080/webhook");
      expect(result).toEqual({
        type: "json",
        url: "https://example.com:8080/webhook",
      });
    });

    it("preserves query parameters", () => {
      const result = parseNotificationUrl(
        "json://example.com/webhook?key=value",
      );
      expect(result).toEqual({
        type: "json",
        url: "https://example.com/webhook?key=value",
      });
    });
  });

  describe("unsupported schemes", () => {
    it("throws on unknown scheme", () => {
      expect(() => parseNotificationUrl("slack://token/channel")).toThrow(
        'Unsupported notification scheme "slack"',
      );
    });
  });
});
