import { DateTime } from "luxon";
import { http, HttpResponse } from "msw";

import type { Session } from "@/lib/auth/client";
import type { AnyHandler } from "msw";

export const handlers = [
  http.get("**/api/auth/get-session", () => {
    const now = DateTime.now();
    const userId = "1";

    return HttpResponse.json<Session>({
      user: {
        id: userId,
        banned: false,
        name: "Test User",
        createdAt: now.toJSDate(),
        email: "test@example.com",
        role: "admin",
        emailVerified: true,
        updatedAt: now.toJSDate(),
      },
      session: {
        id: "1",
        createdAt: now.toJSDate(),
        updatedAt: now.toJSDate(),
        expiresAt: now.plus({ months: 1 }).toJSDate(),
        token: "test-token",
        userId,
      },
    });
  }),
] as const satisfies AnyHandler[];
