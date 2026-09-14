import { Migration } from "@mikro-orm/migrations";

export class Migration20260912191146 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`alter table "item_request" add "preferences" jsonb null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "item_request" drop column "preferences";`);
  }
}
