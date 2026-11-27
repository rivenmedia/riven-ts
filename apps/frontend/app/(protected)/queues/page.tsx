import { headers } from "next/headers";

import { resolveLocale } from "#lib/utils/resolve-locale.ts";

import { getLiveStatus, getQueues } from "./_data/queue-data.ts";
import { QueuesOverviewPage } from "./page.client";

export default async function QueuesPage() {
  const headersList = await headers();
  const locale = resolveLocale(headersList.get("accept-language"));

  return (
    <QueuesOverviewPage
      queues={getQueues()}
      liveStatus={getLiveStatus()}
      locale={locale}
    />
  );
}
