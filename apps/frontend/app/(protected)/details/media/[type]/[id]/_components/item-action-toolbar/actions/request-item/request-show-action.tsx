"use client";

import { SeasonSelector } from "../../../season-selector";
import { BaseRequestItemAction } from "./_components/base-request-item-action";
import { TriggerButton } from "./_components/trigger-button";

import type { SeasonData } from "../../../season-selector";
import type { BaseRequestItemActionProps } from "./_components/base-request-item-action";

interface RequestShowActionProps extends Pick<
  BaseRequestItemActionProps,
  "title"
> {
  seasons: SeasonData[];
  requestedSeasons: Set<number>;
  imdbId: string | null;
  tvdbId: string | null;
}

export function RequestShowAction({
  title,
  imdbId,
  tvdbId,
  seasons,
  requestedSeasons,
}: RequestShowActionProps) {
  return (
    <BaseRequestItemAction
      externalIds={{
        imdbId,
        tvdbId,
        tmdbId: null,
      }}
      title={title}
      defaultFormValues={{
        requestedSeasons: Object.fromEntries(
          requestedSeasons.values().map((value) => [value.toString(), true]),
        ),
      }}
      slots={{
        triggerButton: (
          <TriggerButton
            label={`Request ${requestedSeasons.size > 0 ? "more" : ""}`.trimEnd()}
          />
        ),
        content: (
          <div className="my-4 space-y-2">
            <SeasonSelector
              seasons={seasons}
              requestedSeasons={requestedSeasons}
            />
          </div>
        ),
        requestButtonLabel: "Request Selected",
      }}
    />
  );
}
