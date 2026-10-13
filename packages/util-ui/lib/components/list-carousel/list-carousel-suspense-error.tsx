import { Button } from "#components/_ui/button.tsx";

import type { FallbackProps } from "react-error-boundary";

export function ListCarouselSuspenseError({
  error,
  resetErrorBoundary: handleReset,
}: FallbackProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      Error loading items: {String(error)}
      <div>
        <Button onClick={handleReset} type="button">
          Retry
        </Button>
      </div>
    </div>
  );
}
