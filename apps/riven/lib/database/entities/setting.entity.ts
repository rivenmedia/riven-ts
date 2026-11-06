import { PrimaryKeyProp } from "@mikro-orm/core";
import { Entity, Property } from "@mikro-orm/decorators/legacy";

@Entity()
export class Setting {
  public [PrimaryKeyProp]?: ["namespace", "key"];

  @Property({ primary: true })
  public namespace!: string;

  @Property({ primary: true })
  public key!: string;

  // Row existence (not a non-null value) means "overridden"; null is an explicit null.
  @Property({ type: "jsonb", nullable: true })
  public value!: unknown;

  @Property({
    type: "datetime",
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  public updatedAt!: Date;
}
