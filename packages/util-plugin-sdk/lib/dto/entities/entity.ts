import { type ValidationError, validate } from "class-validator";

import type { Constructor } from "type-fest";

export abstract class BaseEntity {
  static create<T extends BaseEntity>(
    this: Constructor<T>,
    data: Partial<T>,
  ): T {
    return Object.assign(new this(), data);
  }

  async validate(): Promise<ValidationError[]> {
    return validate(this);
  }
}
