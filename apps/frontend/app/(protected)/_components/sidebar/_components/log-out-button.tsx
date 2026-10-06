"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "#components/_ui/button.tsx";
import { authClient } from "#lib/auth/client.ts";

export function LogOutButton() {
  const router = useRouter();

  return (
    <Button
      onClick={() => {
        async function signOut() {
          await authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                router.push("/login");
              },
            },
          });
        }

        void signOut();
      }}
      variant="ghost"
      size="icon"
      className="size-10 cursor-pointer rounded-md"
      aria-label="Logout"
    >
      <LogOut className="size-5" />
    </Button>
  );
}
