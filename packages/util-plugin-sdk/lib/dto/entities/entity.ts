import { type ValidationError, validate } from "class-validator";

import type { Constructor } from "type-fest";

export abstract class BaseEntity {
  static create<T extends BaseEntity>(
    this: Constructor<T>,
    data: Partial<T>,
  ): T {
    const instance = new this();

    for (const [key, value] of Object.entries(data)) {
      try {
        (instance as Record<string, unknown>)[key] = value;
      } catch {
        /* empty */
      }
    }

    return instance;
  }

  async validate(): Promise<ValidationError[]> {
    return validate(this);
  }
}
