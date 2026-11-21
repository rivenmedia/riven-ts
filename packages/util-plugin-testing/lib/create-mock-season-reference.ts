import type { Episode } from "@repo/util-plugin-sdk/dto/entities";

/**
 * A fake of an episode's season reference whose `loadProperty` resolves to
 * the given season number.
 */
export const createMockSeasonReference = (seasonNumber: number) =>
  ({
    loadProperty: async () => Promise.resolve(seasonNumber),
  }) as unknown as Episode["season"];
