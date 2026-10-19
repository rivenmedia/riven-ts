import { cn } from "cn";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { Checkbox } from "#components/_ui/checkbox.tsx";
import { Field, FieldGroup, FieldLabel } from "#components/_ui/field.tsx";

import type { IndexerSeason } from "#app/_types/__generated__/graphql.ts";
import type { RequestShowFormValues } from "../_schemas/request-show.form-schema";
import type { HTMLAttributes } from "react";

interface SeasonSelectorProps extends Pick<
  HTMLAttributes<HTMLDivElement>,
  "className"
> {
  seasons: IndexerSeason[];
  requestedSeasons: Set<number>;
}

export function SeasonSelector({
  className,
  seasons,
  requestedSeasons,
}: SeasonSelectorProps) {
  const { setValue, control } = useFormContext<RequestShowFormValues>();
  const { requestedSeasons: selectedSeasonNumbers = {} } = useWatch({
    control,
  });

  const totalSelected = Object.keys(selectedSeasonNumbers).length;
  const requestableSeasons = seasons.length - requestedSeasons.size;

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
            const { length: selectedCount } = Object.values(
              selectedSeasonNumbers,
            ).filter(Boolean);

            for (const season of seasons) {
              setValue(
                `requestedSeasons.${season.number.toString()}`,
                selectedCount === 0,
                {
                  shouldDirty: true,
                  shouldValidate: true,
                },
              );
            }
          }}
          disabled={requestableSeasons === 0}
        >
          {totalSelected > 0 ? "Deselect all" : "Select all"}
        </button>
      </div>
      {seasons.map((season) => {
        const isPreviouslyRequested = requestedSeasons.has(season.number);

        function renderContent() {
          if (isPreviouslyRequested) {
            return (
              <span className="text-xs font-normal opacity-70">Requested</span>
            );
          }

          // if (season.completedCount < season.episodes.length) {
          //   return (
          //     <span className="text-muted-foreground text-xs font-normal opacity-70">
          //       {season.completedCount}/{season.episodeCount} eps
          //     </span>
          //   );
          // }

          return (
            <span className="text-muted-foreground text-xs font-normal opacity-70">
              {season.episodes.length} eps
            </span>
          );
        }

        const name = `requestedSeasons.${season.number.toString()}` as const;

        return (
          <FieldGroup key={season.id}>
            <Field orientation="horizontal">
              <Controller
                name={name}
                control={control}
                disabled={isPreviouslyRequested}
                render={({ field }) => (
                  <>
                    <Checkbox
                      {...field}
                      id={name}
                      checked={field.value ?? false}
                      defaultChecked={isPreviouslyRequested}
                      onCheckedChange={(checked) => {
                        setValue(name, checked === true, {
                          shouldDirty: true,
                        });
                      }}
                      value="1"
                    />
                    <FieldLabel htmlFor={name}>
                      <span>Season {season.number}</span>
                    </FieldLabel>
                  </>
                )}
              />
              {renderContent()}
            </Field>
          </FieldGroup>
        );
      })}
    </div>
  );
}
