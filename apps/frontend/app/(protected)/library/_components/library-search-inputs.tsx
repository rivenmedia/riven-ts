import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

import { startCase } from "es-toolkit";
import { Search } from "lucide-react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { useDebounce } from "react-use";

import { Input } from "#components/_ui/input.tsx";
import {
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Select,
} from "#components/_ui/select.tsx";

import type { LibrarySearchFormValues } from "../_schemas/library-search.form-schema";
import type { RefObject } from "react";

interface LibrarySearchInputsProps {
  lastSubmittedSearchRef: RefObject<string | undefined>;
  submitForm: () => void;
}

export function LibrarySearchInputs({
  submitForm,
  lastSubmittedSearchRef,
}: LibrarySearchInputsProps) {
  const { control, register, setValue } =
    useFormContext<LibrarySearchFormValues>();
  const { defaultValues } = useFormState<LibrarySearchFormValues>();
  const search = useWatch({ control, name: "search" });

  const [, cancelDebouncedSearch] = useDebounce(
    () => {
      if (search === lastSubmittedSearchRef.current) {
        return;
      }

      submitForm();
    },
    300,
    [search],
  );

  const handleFilterChange = () => {
    // Filter changes submit immediately, which already includes the latest search term
    cancelDebouncedSearch();
    submitForm();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/5 bg-zinc-900/40 p-2 shadow-2xl backdrop-blur-md md:gap-3">
      <div className="group relative flex grow">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-white" />
        <Input
          {...register("search")}
          placeholder="Search..."
          className="h-10 rounded-xl border-transparent bg-transparent pl-9 transition-all placeholder:text-zinc-600 hover:bg-white/5 focus:bg-white/10"
        />
      </div>
      <div className="mx-1 hidden h-6 w-px bg-white/10 md:block" />
      <div className="flex shrink gap-2">
        <Select
          {...register("type")}
          defaultValue={defaultValues?.type ?? ""}
          onValueChange={(value: LibrarySearchFormValues["type"]) => {
            setValue("type", value);
            handleFilterChange();
          }}
        >
          <SelectTrigger aria-label="Type" className="w-30 space-y-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="movies">Movies</SelectItem>
            <SelectItem value="tv">TV Shows</SelectItem>
          </SelectContent>
        </Select>
        <Select
          {...register("state")}
          defaultValue={defaultValues?.state ?? ""}
          onValueChange={(value: LibrarySearchFormValues["state"]) => {
            setValue("state", value);
            handleFilterChange();
          }}
        >
          <SelectTrigger aria-label="State" className="w-45 space-y-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {MediaItemState.options.map((state) => (
              <SelectItem key={state} value={state}>
                {startCase(state)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
