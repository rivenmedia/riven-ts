import { createSafeActionClient } from "next-safe-action";
import { headers } from "next/headers";

export const actionClient = createSafeActionClient().use(async ({ next }) => {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (!origin) {
    throw new Error("Origin header is missing in the request");
  }

  return next({ ctx: { origin } });
});
