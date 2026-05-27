import { Migration } from "@mikro-orm/migrations";

export class Migration20260527162800 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`alter table "media_item" add column "download_id" text null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "media_item" drop column "download_id";`);
  }
}
