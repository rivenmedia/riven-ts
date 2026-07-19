import type { BaseSeeder } from "../../database/seeders/base.seeder.ts";
import type { EntityManager } from "@mikro-orm/core";
import type { AnyHandler } from "msw";
import type { Constructor } from "type-fest";

export abstract class MockScenario {
  public abstract readonly scenarioName: string;

  public environmentData?: Record<string, unknown>;

  public readonly handlers?: readonly [AnyHandler, ...AnyHandler[]];

  protected readonly seeder: Constructor<BaseSeeder> | null = null;

  public async seed(_em: EntityManager): Promise<void> {
    if (this.seeder) {
      throw Error("`seed` must be implemented when a seeder is provided");
    }

    return Promise.resolve();
  }
}
