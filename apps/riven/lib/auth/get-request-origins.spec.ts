import { expect, it } from "vitest";

import { getRequestOrigins } from "./get-request-origins.ts";

it("trusts the host the frontend forwarded the request from", () => {
  const request = new Request("http://127.0.0.1:3000/api/auth/sign-out", {
    headers: {
      host: "127.0.0.1:3000",
      "x-forwarded-host": "riven.example.com",
    },
  });

  expect(getRequestOrigins(request)).toStrictEqual([
    "https://riven.example.com",
    "http://riven.example.com",
  ]);
});

it("uses the first host when a proxy chain forwarded several", () => {
  const request = new Request("http://127.0.0.1:3000/api/auth/sign-out", {
    headers: { "x-forwarded-host": "riven.example.com, 127.0.0.1:9000" },
  });

  expect(getRequestOrigins(request)).toStrictEqual([
    "https://riven.example.com",
    "http://riven.example.com",
  ]);
});

it("falls back to the host header when the request wasn't forwarded", () => {
  const request = new Request("http://localhost:3000/api/auth/sign-out", {
    headers: { host: "localhost:3000" },
  });

  expect(getRequestOrigins(request)).toStrictEqual([
    "https://localhost:3000",
    "http://localhost:3000",
  ]);
});

it("trusts bracketed IPv6 hosts", () => {
  const request = new Request("http://[::1]:9000/api/auth/sign-out", {
    headers: { "x-forwarded-host": "[::1]:9000" },
  });

  expect(getRequestOrigins(request)).toStrictEqual([
    "https://[::1]:9000",
    "http://[::1]:9000",
  ]);
});

it.for([
  { description: "a wildcard", host: "*" },
  { description: "a wildcard subdomain", host: "*.example.com" },
  { description: "a path", host: "riven.example.com/evil" },
  { description: "credentials", host: "user@riven.example.com" },
  { description: "a scheme", host: "https://riven.example.com" },
])("ignores a host containing $description", ({ host }) => {
  const request = new Request("http://127.0.0.1:3000/api/auth/sign-out", {
    headers: { "x-forwarded-host": host },
  });

  expect(getRequestOrigins(request)).toStrictEqual([]);
});

it("trusts nothing without a request", () => {
  expect(getRequestOrigins(undefined)).toStrictEqual([]);
});
