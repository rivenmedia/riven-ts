import { MediaItemUnion } from "@repo/util-plugin-sdk/dto/unions/index";

import { Arg, Query, Resolver } from "type-graphql";

import { CoreContext } from "#graphql/decorators/core-context.ts";

@Resolver()
export class CalendarResolver {
  @Query(() => [MediaItemUnion])
  public async calendar(
    @CoreContext() { services: { calendarService } }: CoreContext,
    @Arg("from") from: Date,
    @Arg("to") to: Date,
  ) {
    return calendarService.getCalendarItems(from, to);
  }
}
