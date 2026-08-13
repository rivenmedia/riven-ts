// oxlint-disable-next-line consistent-type-imports -- Must stay a value import: `import type` is erased under verbatimModuleSyntax, which would degrade the emitted decorator metadata to Object and break Nest's resolution of subclasses.
import { MikroORM } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";

/**
 * The base class for database services.
 *
 * Decorated with `@Injectable` so that `design:paramtypes` metadata is emitted
 * here: subclasses do not declare their own constructors, and Nest resolves
 * their dependencies by walking the prototype chain to this class.
 *
 * `MikroORM` is imported as a value rather than a type because the emitted
 * metadata must reference the runtime class for Nest to resolve it.
 */
@Injectable()
export abstract class BaseService {
  private readonly orm!: MikroORM;

  protected get em() {
    return this.orm.em;
  }

  public constructor(orm: MikroORM) {
    this.orm = orm;
  }
}
