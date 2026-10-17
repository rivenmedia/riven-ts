import type { PluginPageParams } from "@repo/util-plugin-sdk/ui";

export interface PluginRouteMatch<Page> {
  route: string;
  page: Page;
  params: PluginPageParams;
}

/**
 * How specific a matched route segment is. Lower values are more specific.
 */
const SegmentRank = {
  static: 0,
  dynamic: 1,
  catchAll: 2,
} as const;

type SegmentRank = (typeof SegmentRank)[keyof typeof SegmentRank];

/**
 * Gets the param name from a dynamic (`[name]`) or catch-all (`[...name]`) route segment.
 */
function getParamName(routeSegment: string, prefix: "[" | "[...") {
  if (!routeSegment.startsWith(prefix) || !routeSegment.endsWith("]")) {
    return;
  }

  return routeSegment.slice(prefix.length, -1) || undefined;
}

function matchRoute(route: string, segments: readonly string[]) {
  const routeSegments = route === "" ? [] : route.split("/");
  const params: PluginPageParams = {};
  const ranks: SegmentRank[] = [];

  for (const [index, routeSegment] of routeSegments.entries()) {
    const catchAllName = getParamName(routeSegment, "[...");

    if (catchAllName) {
      const rest = segments.slice(index);

      if (index !== routeSegments.length - 1 || rest.length === 0) {
        return;
      }

      params[catchAllName] = rest;
      ranks.push(SegmentRank.catchAll);

      return { params, ranks };
    }

    const segment = segments[index];

    if (segment === undefined) {
      return;
    }

    const dynamicName = getParamName(routeSegment, "[");

    if (dynamicName) {
      params[dynamicName] = segment;
      ranks.push(SegmentRank.dynamic);
    } else if (routeSegment === segment) {
      ranks.push(SegmentRank.static);
    } else {
      return;
    }
  }

  if (routeSegments.length !== segments.length) {
    return;
  }

  return { params, ranks };
}

function compareRanks(a: readonly SegmentRank[], b: readonly SegmentRank[]) {
  for (const [index, rank] of a.entries()) {
    const difference = rank - (b[index] ?? 0);

    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

/**
 * Finds the page for the given URL segments.
 *
 * When multiple routes match, the most specific is chosen by comparing each segment in order:
 * static segments are preferred over dynamic segments, which are preferred over catch-all segments.
 */
export function matchPluginRoute<Page>(
  pages: Readonly<Record<string, Page>>,
  segments: readonly string[],
): PluginRouteMatch<Page> | undefined {
  let bestMatch: (PluginRouteMatch<Page> & { ranks: SegmentRank[] }) | null =
    null;

  for (const [route, page] of Object.entries(pages)) {
    const match = matchRoute(route, segments);

    if (
      match &&
      (!bestMatch || compareRanks(match.ranks, bestMatch.ranks) < 0)
    ) {
      bestMatch = { route, page, ...match };
    }
  }

  if (!bestMatch) {
    return;
  }

  const { ranks: _, ...result } = bestMatch;

  return result;
}
