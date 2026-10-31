import { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

import { EnsureRequestContext } from "@mikro-orm/decorators/legacy";
import { DateTime } from "luxon";

import { BaseService } from "#database/services/core/base-service.ts";

export class CalendarService extends BaseService {
  @EnsureRequestContext()
  public async getCalendarItems(from: Date, to: Date) {
    return this.em.getRepository(MediaItem).find(
      {
        releaseDate: {
          $gte: DateTime.fromJSDate(from).startOf("day").toJSDate(),
          $lte: DateTime.fromJSDate(to).endOf("day").toJSDate(),
        },
      },
      {
        orderBy: {
          type: "desc", // Place items closer to the root of the hierarchy first (e.g. show before episodes)
        },
      },
    );
  }
}
