import { http, HttpResponse } from "msw";

export const hasPermissionHandler = http.post(
  "**/api/auth/admin/has-permission",
  () => HttpResponse.json({ success: true }),
);
