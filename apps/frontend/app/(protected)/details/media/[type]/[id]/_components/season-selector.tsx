import { Checkbox } from "@/components/_ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/_ui/field";

import { cn } from "cn";
import { useFormContext } from "react-hook-form";

import type { HTMLAttributes } from "react";

export interface SeasonData {
  id: string;
  seasonNumber: number;
  name: string;
  completedCount: number;
  episodeCount: number;
  image: string | null;
}

interface SeasonSelectorProps extends Pick<
  HTMLAttributes<HTMLDivElement>,
  "className"
> {
  seasons: SeasonData[];
  requestedSeasons: Set<number>;
}

export function SeasonSelector({
  className,
  seasons,
  requestedSeasons,
}: SeasonSelectorProps) {
  const { register, setValue } = useFormContext();

  return (
    <div
      className={cn(
        className,
        "flex max-h-60 w-full flex-col gap-0.5 overflow-y-auto",
      )}
    >
      <div className="flex items-center justify-end">
        <button
          type="button"
          className="text-xs text-zinc-400 transition hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            // selectedSeasonNums =
            //   selectedSeasonNums.length > 0
            //     ? []
            //     : [...requestableSeasons];
          }}
          // disabled={requestableSeasons.length === 0}
        >
          {/* {selectedSeasonNums.length > 0 ? "Deselect all" : "Select all"} */}
        </button>
      </div>
      {seasons.map((season) => {
        const isPreviouslyRequested = requestedSeasons.has(season.seasonNumber);

        function renderContent() {
          if (isPreviouslyRequested) {
            return (
              <span className="text-xs font-normal opacity-70">Requested</span>
            );
          }

          if (season.completedCount < season.episodeCount) {
            return (
              <span className="text-muted-foreground text-xs font-normal opacity-70">
                {season.completedCount}/{season.episodeCount} eps
              </span>
            );
          }

          return (
            <span className="text-muted-foreground text-xs font-normal opacity-70">
              {season.episodeCount} eps
            </span>
          );
        }

        const name =
          `requestedSeasons[${season.seasonNumber.toString()}]` as const;

        return (
          <FieldGroup key={season.id}>
            <Field orientation="horizontal">
              <Checkbox
                {...register(name, { disabled: isPreviouslyRequested })}
                id={name}
                defaultChecked={isPreviouslyRequested}
                onCheckedChange={(checked) => {
                  setValue(name, checked, { shouldDirty: true });
                }}
                value="1"
              />
              <FieldLabel htmlFor={name}>
                <span>Season {season.seasonNumber}</span>
              </FieldLabel>
              {renderContent()}
            </Field>
          </FieldGroup>
        );
      })}
    </div>
  );
}
