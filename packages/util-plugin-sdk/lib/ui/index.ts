import type { ReactNode } from "react";

/**
 * Params extracted from a plugin page route.
 * Keys are the names of the dynamic segments in the route.
 */
export type PluginPageParams = Record<string, string | string[]>;

export type PluginPageSearchParams = Record<
  string,
  string | string[] | undefined
>;

type SegmentParams<Segment extends string> =
  Segment extends `[...${infer Name}]`
    ? Record<Name, string[]>
    : Segment extends `[${infer Name}]`
      ? Record<Name, string>
      : Record<never, never>;

type RouteParams<Route extends string> =
  Route extends `${infer Segment}/${infer Rest}`
    ? SegmentParams<Segment> & RouteParams<Rest>
    : SegmentParams<Route>;

/**
 * Infers the params for a plugin page route pattern.
 *
 * Routes are `/`-separated segments, relative to `/plugin/{name}`. Segments can be:
 * - static, e.g. `settings`
 * - dynamic, e.g. `[id]`, which matches a single segment
 * - catch-all, e.g. `[...path]`, which matches one or more trailing segments
 *
 * @example
 * PluginPageRouteParams<"movie/[id]/[...rest]">; // { id: string; rest: string[] }
 */
export type PluginPageRouteParams<Route extends string> = {
  [Key in keyof RouteParams<Route>]: RouteParams<Route>[Key];
};

/**
 * Props passed to a plugin page.
 *
 * These mirror the props NextJS passes to its own pages.
 */
export interface PluginPageProps<Params extends object = PluginPageParams> {
  params: Promise<Params>;
  searchParams: Promise<PluginPageSearchParams>;
}

/**
 * A plugin page component. This can be a React Server Component.
 *
 * Declared as a method so the params are checked bivariantly,
 * allowing pages with specific params to be stored alongside each other.
 */
export type PluginPageComponent<Params extends object = PluginPageParams> = {
  // oxlint-disable-next-line typescript/method-signature-style -- Method parameters are checked bivariantly
  render(props: PluginPageProps<Params>): ReactNode | Promise<ReactNode>;
}["render"];

export interface PluginPage<Params extends object = PluginPageParams> {
  /**
   * Loads the page component.
   *
   * This should dynamically import the page, so it is only loaded when the route is visited.
   *
   * @example
   * async load() {
   *   const { MoviePage } = await import("./movie/page.tsx");
   *
   *   return MoviePage;
   * }
   */
  load: () => Promise<PluginPageComponent<Params>>;
}

/**
 * The UI provided by a plugin.
 *
 * Plugins provide UI by exporting a `ui` object from a `./ui` package entry point,
 * which is then registered in the frontend.
 */
export interface RivenPluginUi {
  /**
   * Pages served by the frontend under `/plugin/{name}/{route}`, keyed by route.
   *
   * An empty route (`""`) serves the page at `/plugin/{name}`.
   */
  pages: Record<string, PluginPage>;
}

/**
 * Defines the UI for a plugin, inferring the params of each page from its route.
 *
 * @example
 * export const ui = definePluginUi({
 *   pages: {
 *     "movie/[id]": {
 *       async load() {
 *         const { MoviePage } = await import("./movie/page.tsx");
 *
 *         return MoviePage;
 *       },
 *     },
 *   },
 * });
 */
export function definePluginUi<Pages extends Record<string, PluginPage>>(ui: {
  pages: Pages & {
    [Route in keyof Pages & string]: PluginPage<PluginPageRouteParams<Route>>;
  };
}): RivenPluginUi {
  return ui;
}
