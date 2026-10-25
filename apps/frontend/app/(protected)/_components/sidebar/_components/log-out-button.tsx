"use client";

import { LogOut } from "lucide-react";

import { logout } from "#app/(protected)/_actions/logout.action.ts";
import { Button } from "#components/_ui/button.tsx";

export function LogOutButton() {
  return (
    <Button
      onClick={() => void logout()}
      variant="ghost"
      size="icon"
      className="size-10 cursor-pointer rounded-md"
      aria-label="Logout"
    >
      <LogOut className="size-5" />
    </Button>
  );
}
