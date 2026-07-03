"use client";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { Search } from "lucide-react";
import { useRef } from "react";
import { Controller } from "react-hook-form";

import { search } from "../_actions/search.action";
import { SearchForm } from "../_form-schemas/search.schema";

export function LibrarySearchForm() {
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const { handleSubmitWithAction, form } = useHookFormAction(
    search,
    zodResolver(SearchForm),
    {
      formProps: {
        defaultValues: {
          search: "",
          types: "",
          states: "",
        },
      },
    },
  );

  function handleSearchInput() {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(
      () => void search(form.getValues()),
      300,
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmitWithAction(e)}
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/5 bg-zinc-900/40 p-2 shadow-2xl backdrop-blur-md md:gap-3"
    >
      <div className="group relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-white" />
        <Field className="w-full space-y-0 md:w-64">
          <Controller
            control={form.control}
            name="search"
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Search..."
                onInput={handleSearchInput}
                className="h-10 rounded-xl border-transparent bg-transparent pl-9 transition-all placeholder:text-zinc-600 hover:bg-white/5 focus:bg-white/10"
              />
            )}
          />
        </Field>
      </div>

      <div className="mx-1 hidden h-6 w-px bg-white/10 md:block"></div>

      <Field className="min-w-25 space-y-0">
        <Controller
          control={form.control}
          name="types"
          render={({ field }) => (
            <Select {...field} onValueChange={field.onChange}>
              <SelectTrigger className="h-9 border-0 bg-transparent text-zinc-400 hover:bg-white/5 data-value:text-white data-[state=open]:bg-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900">
                {MediaItemType.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <Field className="min-w-25 space-y-0">
        <Controller
          control={form.control}
          name="states"
          render={({ field }) => (
            <Select
              {...field}
              // type="multiple"
              onValueChange={field.onChange}
            >
              <SelectTrigger className="h-9 border-0 bg-transparent text-zinc-400 hover:bg-white/5 data-value:text-white data-[state=open]:bg-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900">
                {MediaItemState.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      {/* <Controller
        control={form.control}
        name="page"
        render={({ field }) => <input type="hidden" {...field} />}
      />
      <Controller
        control={form.control}
        name="limit"
        render={({ field }) => <input type="hidden" {...field} />}
      /> */}
    </form>
  );
}
