import { client, gql } from "$lib/graphql";

import type { PageLoad } from "./$types";

const PLUGINS = gql`
  query Plugins {
    plugins {
      name
      version
      status
      lastError {
        message
        timestamp
      }
      capabilities
      settings
    }
  }
`;

export type PluginStatus = "healthy" | "degraded" | "error" | string;

export type PluginLastError = {
  message: string;
  timestamp: number;
};

export type Plugin = {
  name: string;
  version: string;
  status: PluginStatus;
  lastError: PluginLastError | null;
  capabilities: string[];
  settings: Record<string, unknown> | null;
};

export type PluginsLoadResult = {
  plugins: Plugin[];
  resolverMissing: boolean;
  errorMessage: string | null;
};

function isSchemaMissing(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /Cannot query field/i.test(msg) ||
    /Unknown type/i.test(msg) ||
    /Field .* doesn't exist/i.test(msg) ||
    /not found in schema/i.test(msg)
  );
}

export const load: PageLoad = async (): Promise<PluginsLoadResult> => {
  try {
    const res = await client.query<{ plugins: Plugin[] }>({
      query: PLUGINS,
      fetchPolicy: "network-only",
    });
    return {
      plugins: res.data?.plugins ?? [],
      resolverMissing: false,
      errorMessage: null,
    };
  } catch (err) {
    if (isSchemaMissing(err)) {
      return {
        plugins: [],
        resolverMissing: true,
        errorMessage: err instanceof Error ? err.message : String(err),
      };
    }
    return {
      plugins: [],
      resolverMissing: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
};
