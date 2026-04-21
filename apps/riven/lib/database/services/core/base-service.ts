import type { MikroORM } from "@mikro-orm/core";

export abstract class BaseService {
  protected readonly orm!: MikroORM;

  get em() {
    return this.orm.em;
  }

  constructor(orm: MikroORM) {
    this.orm = orm;
  }
}
