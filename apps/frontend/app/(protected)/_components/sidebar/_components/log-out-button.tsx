"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

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
