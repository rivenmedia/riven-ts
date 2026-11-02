import { PrimaryKeyProp } from "@mikro-orm/core";
import { Entity, Property } from "@mikro-orm/decorators/legacy";

@Entity()
export class Setting {
  public [PrimaryKeyProp]?: ["key", "namespace"];

  @Property({ primary: true })
  public key!: string;

  @Property({ primary: true })
  public namespace!: string;

  @Property({ type: "jsonb", nullable: true })
  public value!: unknown;

  @Property({
    type: "datetime",
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  public updatedAt!: Date;
}
