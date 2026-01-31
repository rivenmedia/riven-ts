import { extractPluginNameFromJobId } from "./extract-plugin-name-from-job-id.ts";

/**
 * Combines the results of a flow's children into a single array,
 * attaching the name of the runner plugin to each result.
 *
 * @param children The results of a flow's children
 * @returns A zipped version of the provided children, with the name of the runner plugin attached
 */
export const zipFlowChildrenResults = <T>(children: Record<string, T>) =>
  Object.entries(children).reduce<{ result: T; plugin: string }[]>(
    (acc, [key, value]) => [
      ...acc,
      {
        result: value,
        plugin: extractPluginNameFromJobId(key),
      },
    ],
    [],
  );
