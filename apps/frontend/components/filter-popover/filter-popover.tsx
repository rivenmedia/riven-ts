import {
  MovieContentRating,
  ShowContentRating,
} from "@repo/util-plugin-sdk/dto/enums/content-ratings.enum";

import { zodResolver } from "@hookform/resolvers/zod";
import { FilterIcon } from "lucide-react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { Badge } from "../_ui/badge";
import { Button } from "../_ui/button";
import { Checkbox } from "../_ui/checkbox";
import { Label } from "../_ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../_ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../_ui/select";
import { Separator } from "../_ui/separator";
import { Slider } from "../_ui/slider";
import { Toggle } from "../_ui/toggle";
import { DatePicker } from "../date-picker/date-picker";
import { LANGUAGE_OPTIONS, MOVIE_GENRES, TV_GENRES } from "./constants";
import { FilterPopoverFormSchema } from "./filter-popover.form-schema";

import type { FilterPopoverFormValues } from "./filter-popover.form-schema";
import type { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";

export interface FilterPopoverProps {
  onApply: (data: FilterPopoverFormValues) => void;
  mediaType: Extract<MediaItemType, "movie" | "show">;
}

export function FilterPopover({ onApply, mediaType }: FilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const availableGenres = new Set(
    (mediaType === "movie" ? MOVIE_GENRES : TV_GENRES).entries(),
  )
    .values()
    .toArray();

  const availableContentRatings = new Set(
    (mediaType === "movie"
      ? MovieContentRating.exclude(["unknown"])
      : ShowContentRating.exclude(["unknown"])
    ).options,
  )
    .values()
    .toArray();

  const form = useForm({
    resolver: zodResolver(FilterPopoverFormSchema),
    shouldUseNativeValidation: true,
    progressive: true,
    defaultValues: {
      releaseDateFrom: "",
      releaseDateTo: "",
      contentRatings: Object.fromEntries(
        availableContentRatings.map((rating) => [rating, false]),
      ),
      genres: Object.fromEntries(
        availableGenres.values().map(([, id]) => [id, false]),
      ),
      language: "",
      runtime: [0, 400],
      voteAverage: [0, 10],
      voteCount: [0, 1000],
    },
  });

  const [genres, runtime, voteAverage, voteCount, contentRatings] = form.watch([
    "genres",
    "runtime",
    "voteAverage",
    "voteCount",
    "contentRatings",
  ]);

  const handleSubmit = form.handleSubmit((data) => {
    onApply(data);
    setIsOpen(false);
  });

  function createRangeValueUpdater(fieldName: keyof FilterPopoverFormValues) {
    return function updateRangeValue(value: number[]) {
      const [lowerBound, upperBound] = value;

      if (lowerBound == null || upperBound == null) {
        return;
      }

      form.setValue(fieldName, [lowerBound, upperBound], { shouldDirty: true });
    };
  }

  function calculateTotalAppliedFilters() {
    const { dirtyFields } = form.formState;

    const groups: [...(keyof FilterPopoverFormValues)[]][] = [
      ["runtime"],
      ["voteAverage"],
      ["voteCount"],
      ["releaseDateFrom", "releaseDateTo"],
      ["genres"],
      ["language"],
      ["contentRatings"],
    ];

    let totalAppliedFilters = 0;

    for (const group of groups) {
      const isGroupDirty = group.some((field) => dirtyFields[field]);

      if (isGroupDirty) {
        totalAppliedFilters += 1;
      }
    }

    return totalAppliedFilters;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FilterIcon className="size-4" />
          Filters
          {form.formState.isDirty && (
            <Badge variant="secondary" className="px-1.5 py-0 text-xs">
              {calculateTotalAppliedFilters()}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="bg-popover max-h-[80vh] w-96 overflow-y-auto rounded-2xl border-none shadow-2xl shadow-black/50"
        align="end"
      >
        <FormProvider {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Filters</h4>
              {form.formState.isDirty && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="reset"
                  className="h-7 px-2 text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>

            <Separator />

            {/* <!-- Release Date --> */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Release Date</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">From</span>
                  <DatePicker
                    name="releaseDateFrom"
                    placeholder="Pick a date"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">To</span>
                  <DatePicker name="releaseDateTo" placeholder="Pick a date" />
                </div>
              </div>
            </div>

            <Separator />

            {/* <!-- Genres --> */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Genres</span>
              <div className="flex flex-wrap gap-1">
                {availableGenres.map(([name, id]) => (
                  <Toggle
                    asChild
                    key={id}
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    pressed={Boolean(genres[id])}
                  >
                    <Label>
                      <Checkbox
                        {...form.register("genres")}
                        hidden
                        value={id}
                        onCheckedChange={(checked) => {
                          if (checked === "indeterminate") {
                            return;
                          }

                          const { ...currentGenres } = form.getValues("genres");

                          currentGenres[id] = checked;

                          form.setValue("genres", currentGenres, {
                            shouldDirty: true,
                          });
                        }}
                      />
                      {name}
                    </Label>
                  </Toggle>
                ))}
              </div>
            </div>

            <Separator />

            {/* <!-- Language --> */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Language</span>
              <Select
                {...form.register("language")}
                onValueChange={(value) => {
                  form.setValue("language", value, { shouldDirty: true });
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent className="bg-popover rounded-2xl border-none shadow-2xl shadow-black/50">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <SelectItem
                      key={lang.value}
                      value={lang.value}
                      className="text-xs"
                    >
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* <!-- Content Rating (Movies only) --> */}
            <Separator />
            <div className="space-y-2">
              <span className="text-sm font-medium">Content Rating</span>
              <div className="flex flex-wrap gap-1">
                {availableContentRatings.map((rating) => (
                  <Toggle
                    asChild
                    key={rating}
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    pressed={contentRatings[rating]}
                  >
                    <Label>
                      <Checkbox
                        {...form.register("contentRatings")}
                        hidden
                        value={rating}
                        onCheckedChange={(checked) => {
                          if (checked === "indeterminate") {
                            return;
                          }

                          const { ...currentContentRatings } =
                            form.getValues("contentRatings");

                          currentContentRatings[rating] = checked;

                          form.setValue(
                            "contentRatings",
                            currentContentRatings,
                            {
                              shouldDirty: true,
                            },
                          );
                        }}
                      />

                      {rating.toUpperCase()}
                    </Label>
                  </Toggle>
                ))}
              </div>
            </div>

            <Separator />

            {/* <!-- Runtime --> */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Runtime</span>
                <span className="text-muted-foreground text-xs">
                  {runtime.join("-")} min
                </span>
              </div>
              <Slider
                {...form.register("runtime")}
                defaultValue={runtime}
                min={0}
                max={400}
                step={10}
                onValueChange={createRangeValueUpdater("runtime")}
              />
            </div>

            <Separator />

            {/* <!-- User Score --> */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">User Score</span>
                <span className="text-muted-foreground text-xs">
                  {voteAverage.join("-")}
                </span>
              </div>
              <Slider
                {...form.register("voteAverage")}
                defaultValue={voteAverage}
                min={0}
                max={10}
                step={0.5}
                onValueChange={createRangeValueUpdater("voteAverage")}
              />
            </div>

            <Separator />

            {/* <!-- Vote Count --> */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Vote Count</span>
                <span className="text-muted-foreground text-xs">
                  {voteCount.join("-")}
                </span>
              </div>
              <Slider
                {...form.register("voteCount")}
                defaultValue={voteCount}
                min={0}
                max={1000}
                step={50}
                onValueChange={createRangeValueUpdater("voteCount")}
              />
            </div>

            <Separator />

            {/* <!-- Actions --> */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                type="reset"
                disabled={!form.formState.isDirty}
              >
                Clear
              </Button>
              <Button
                size="sm"
                className="flex-1"
                type="submit"
                disabled={!form.formState.isDirty}
              >
                Apply
              </Button>
            </div>
          </form>
        </FormProvider>
      </PopoverContent>
    </Popover>
  );
}
