import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import type { EntityManager } from "@mikro-orm/core";
import type { UUID } from "node:crypto";

export async function saveStreamUrlMutation(
  em: EntityManager,
  id: UUID,
  url: string,
) {
  const entry = await em.findOneOrFail(MediaEntry, id);

  em.assign(entry, {
    streamUrl: url,
  });

  await em.flush();

  return entry;
}
