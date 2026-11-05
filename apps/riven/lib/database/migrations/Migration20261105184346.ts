import { Migration } from "@mikro-orm/migrations";

export class Migration20261105184346 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "setting" ("key" text not null, "namespace" text not null, "value" jsonb null, primary key ("key", "namespace"));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "setting" cascade;`);
  }
}
