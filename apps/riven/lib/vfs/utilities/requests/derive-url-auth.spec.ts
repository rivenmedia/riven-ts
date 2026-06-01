import { describe, expect, it } from "vitest";

import { deriveUrlAuth } from "./derive-url-auth.ts";

const basic = (user: string, pass: string) =>
  `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;

describe("deriveUrlAuth", () => {
  it("extracts Basic auth from userinfo and strips it from the URL", () => {
    const { url, headers } = deriveUrlAuth(
      "http://usenet:usenet@altmount:8081/webdav/complete/Default/Movie.mkv",
    );

    expect(url).toBe("http://altmount:8081/webdav/complete/Default/Movie.mkv");
    expect(headers["authorization"]).toBe(basic("usenet", "usenet"));
  });

  it("leaves a URL without userinfo unchanged and adds no headers", () => {
    const input = "https://store.torbox.app/file.mkv?token=abc123";
    const { url, headers } = deriveUrlAuth(input);

    expect(url).toBe(input);
    expect(headers).toEqual({});
  });

  it("decodes percent-encoded credentials before building the header", () => {
    const { headers } = deriveUrlAuth("http://user:p%40ss@host:8081/x");
    expect(headers["authorization"]).toBe(basic("user", "p@ss"));
  });

  it("preserves the query string and encoded path when stripping userinfo", () => {
    const { url } = deriveUrlAuth("http://u:p@host/a%20b/c.mkv?x=1");
    expect(url).toBe("http://host/a%20b/c.mkv?x=1");
  });

  it("returns a non-URL string unchanged with no headers", () => {
    const { url, headers } = deriveUrlAuth("not a url");
    expect(url).toBe("not a url");
    expect(headers).toEqual({});
  });
});
