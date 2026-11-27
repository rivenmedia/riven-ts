"use client";

import { ErrorDisplay } from "#components/error-display/error-display.tsx";

export default function QueueError({ reset }: { reset: () => void }) {
  return (
    <div className="p-4 md:p-8">
      <ErrorDisplay
        title="Couldn't load this queue"
        errorMessage="Couldn't load the queues. Check that Riven and Redis are running, then try again."
        retryAction={reset}
        buttonText="Try again"
      />
    </div>
  );
}
