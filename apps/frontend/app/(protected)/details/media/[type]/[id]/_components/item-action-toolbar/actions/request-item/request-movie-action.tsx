"use client";

import { BaseRequestItemAction } from "./_components/base-request-item-action";
import { TriggerButton } from "./_components/trigger-button";

import type { BaseRequestItemActionProps } from "./_components/base-request-item-action";

type RequestMovieActionProps = Pick<BaseRequestItemActionProps, "title"> & {
  tmdbId: string;
  imdbId: string | null;
};

export function RequestMovieAction({
  title,
  tmdbId,
  imdbId,
}: RequestMovieActionProps) {
  return (
    <BaseRequestItemAction
      externalIds={{
        imdbId,
        tmdbId,
        tvdbId: null,
      }}
      title={title}
      slots={{
        content: (
          <div className="text-muted-foreground py-4 text-sm">
            This request will be approved automatically.
          </div>
        ),
        triggerButton: <TriggerButton label="Request" />,
        requestButtonLabel: "Request",
      }}
    />
  );
}
