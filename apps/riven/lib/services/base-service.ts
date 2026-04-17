import type { EntityManager } from "@mikro-orm/core";

export abstract class BaseService {
  protected readonly em!: EntityManager;

  constructor(em: EntityManager) {
    this.em = em;
  }
}
