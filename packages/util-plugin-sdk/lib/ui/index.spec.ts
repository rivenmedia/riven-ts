import { expect, expectTypeOf, it } from "vitest";

import { definePluginUi } from "./index.ts";

import type { PluginPageProps, PluginPageRouteParams } from "./index.ts";

async function MoviePage({
  params,
}: PluginPageProps<PluginPageRouteParams<"movie/[id]">>) {
  const { id } = await params;

  return id;
}

function IndexPage() {
  return null;
}

it("infers params from a route", () => {
  expectTypeOf<PluginPageRouteParams<"">>().toEqualTypeOf<
    Record<never, never>
  >();
  expectTypeOf<PluginPageRouteParams<"settings">>().toEqualTypeOf<
    Record<never, never>
  >();
  expectTypeOf<PluginPageRouteParams<"[type]/[id]">>().toEqualTypeOf<{
    type: string;
    id: string;
  }>();
  expectTypeOf<PluginPageRouteParams<"browse/[...path]">>().toEqualTypeOf<{
    path: string[];
  }>();
});

it("returns the provided UI", () => {
  const pages = {
    "": { load: async () => Promise.resolve(IndexPage) },
    "movie/[id]": { load: async () => Promise.resolve(MoviePage) },
  };

  expect(definePluginUi({ pages })).toStrictEqual({ pages });
});

it("rejects pages whose params don't match their route", () => {
  definePluginUi({
    pages: {
      // @ts-expect-error - `MoviePage` expects an `id` param
      "movie/[slug]": { load: async () => Promise.resolve(MoviePage) },
    },
  });

  expectTypeOf(definePluginUi).toBeFunction();
});
