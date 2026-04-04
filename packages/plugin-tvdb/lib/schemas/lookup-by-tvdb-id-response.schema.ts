import { type } from "arktype";
import { type TimezoneName, getAllTimezones } from "countries-and-timezones";

export const LookupByTvdbIdResponse = type({
  network: type.or(
    {
      country: {
        timezone: type.enumerated(
          Object.keys(getAllTimezones()) as TimezoneName[],
        ),
      },
    },
    "null",
  ),
});

export type LookupByTvdbIdResponse = typeof LookupByTvdbIdResponse.infer;
