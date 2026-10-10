import { EntityRepository } from "@mikro-orm/core";

import type { Stream } from "#dto/entities/index.ts";

export class StreamRepository extends EntityRepository<Stream> {}
