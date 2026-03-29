import { Seeder } from "@mikro-orm/seeder";

import type { Dictionary, EntityManager } from "@mikro-orm/core";
import type { Constructor } from "type-fest";

export abstract class BaseSeeder<
  T extends Dictionary = Dictionary,
> extends Seeder<T> {
  context: T = {} as T;

  protected override call(
    em: EntityManager,
    seeders: Constructor<BaseSeeder>[],
    context: T,
  ): Promise<void> {
    return super.call(em, seeders, context);
  }
}
