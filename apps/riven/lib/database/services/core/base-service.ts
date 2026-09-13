import type { MikroORM } from "@mikro-orm/core";

export abstract class BaseService {
  private readonly orm!: MikroORM;

  protected get em() {
    return this.orm.em;
  }

  public constructor(orm: MikroORM) {
    this.orm = orm;
  }
}
