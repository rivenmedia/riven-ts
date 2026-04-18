import { EntityRepository } from "@mikro-orm/core";

import type { Stream } from "../entities/index.ts";

export class StreamRepository extends EntityRepository<Stream> {}
