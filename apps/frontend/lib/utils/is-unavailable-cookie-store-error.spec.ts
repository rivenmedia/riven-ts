import { expect, it } from "vitest";

import { isUnavailableCookieStoreError } from "./is-unavailable-cookie-store-error.ts";

it.for([
  "`cookies` was called outside a request scope. Read more: https://nextjs.org/docs",
  "Cannot find module 'next/headers'",
])("recognises the error %j", (message) => {
  expect(isUnavailableCookieStoreError(new Error(message))).toBe(true);
});

it.for([
  { label: "another error", error: new Error("Network request failed") },
  { label: "a non-error", error: "Cannot find module 'next/headers'" },
  { label: "nothing", error: undefined },
])("does not recognise $label", ({ error }) => {
  expect(isUnavailableCookieStoreError(error)).toBe(false);
});
