import { Seeder } from "@mikro-orm/seeder";

import type { Dictionary, EntityManager } from "@mikro-orm/core";
import type { Constructor } from "type-fest";

export abstract class BaseSeeder<T extends Dictionary> extends Seeder<T> {
  context: T | undefined;

  constructor(context?: T) {
    super();

    this.context = context;
  }

  protected override call(
    em: EntityManager,
    seeders: Constructor<Seeder>[],
    context?: T,
  ): Promise<void> {
    return super.call(em, seeders, context ?? this.context);
  }
}
