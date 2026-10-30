"use client";

import { logout } from "#app/(protected)/_actions/logout.action.ts";
import { Button } from "#components/_ui/button.tsx";

export function LogoutButton() {
  return (
    <Button
      variant="secondary"
      className="w-full sm:w-auto"
      onClick={() => void logout()}
      type="button"
    >
      Logout
    </Button>
  );
}
