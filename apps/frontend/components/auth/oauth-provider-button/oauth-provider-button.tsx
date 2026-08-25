import { Button } from "@/components/_ui/button";

import { Star } from "lucide-react";
import Image from "next/image";

export interface OauthProviderButtonProps {
  isLastUsed: boolean;
  providerKey: string;
  provider: { name?: string; icon?: string };
  onClick: () => void;
}

export function OauthProviderButton({
  isLastUsed,
  onClick,
  provider,
  providerKey,
}: OauthProviderButtonProps) {
  const providerName =
    provider.name ?? providerKey.charAt(0).toUpperCase() + providerKey.slice(1);

  function renderProviderIcon() {
    if (providerKey === "plex") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          className="mr-2 h-4 w-4"
        >
          <path
            d="M256 70H148l108 186-108 186h108l108-186z"
            fill="currentColor"
          />
        </svg>
      );
    }

    if (provider.icon) {
      return (
        <Image
          src={provider.icon}
          alt={`${providerName} icon`}
          className="mr-2 h-4 w-4"
          width={16}
          height={16}
        />
      );
    }

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mr-2 h-4 w-4"
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    );
  }

  return (
    <Button
      onClick={onClick}
      variant={isLastUsed ? "secondary" : "outline"}
      className="relative w-full"
      type="button"
    >
      {renderProviderIcon()}
      Login with {providerName}
      {isLastUsed && (
        <Star className="absolute top-0 -right-2 h-4 w-4 rotate-45 animate-pulse text-yellow-400" />
      )}
    </Button>
  );
}
