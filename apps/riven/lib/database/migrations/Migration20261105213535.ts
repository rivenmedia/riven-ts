import { Migration } from "@mikro-orm/migrations";

export class Migration20261105213535 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`alter table "setting" drop constraint "setting_pkey";`);
    this.addSql(`alter table "setting" add "updated_at" timestamptz not null;`);
    this.addSql(`alter table "setting" add primary key ("namespace", "key");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "setting" drop constraint "setting_pkey";`);
    this.addSql(`alter table "setting" drop column "updated_at";`);
    this.addSql(`alter table "setting" add primary key ("key", "namespace");`);
  }
}
