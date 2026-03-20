import { type TimezoneName, getAllTimezones } from "countries-and-timezones";
import z from "zod";

export const LookupByTvdbIdResponse = z.object({
  network: z
    .object({
      country: z.object({
        timezone: z.enum(Object.keys(getAllTimezones()) as TimezoneName[]),
      }),
    })
    .nullable(),
});

export type LookupByTvdbIdResponse = z.infer<typeof LookupByTvdbIdResponse>;
