import { RotateCw } from "lucide-react";
import { io } from "next/cache";
import { Suspense } from "react";

import { query } from "#lib/graphql/client.ts";

import { HideOnError } from "./_components/hide-on-error";
import { INSTANCE_RESTART_STATUS } from "./_queries/instance-restart-status.query";

async function RestartBannerLoader() {
  await io();

  const { data } = await query({ query: INSTANCE_RESTART_STATUS });

  if (!data?.instanceStatus.restartRequired) {
    return null;
  }

  return (
    <output className="border-primary/30 bg-primary/10 flex items-center gap-3 rounded-lg border p-4 text-sm">
      <RotateCw aria-hidden className="text-primary size-4 shrink-0" />
      <span>Settings changed. Restart Riven to apply them.</span>
    </output>
  );
}

/**
 * Tells the user to restart Riven when changed settings haven't applied yet.
 *
 * The banner is optional, so it's hidden if the restart status can't load.
 */
export function RestartBanner() {
  return (
    <HideOnError>
      <Suspense>
        <RestartBannerLoader />
      </Suspense>
    </HideOnError>
  );
}
