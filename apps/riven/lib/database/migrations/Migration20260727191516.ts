import { Migration } from "@mikro-orm/migrations";

export class Migration20260727191516 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "media_item" add constraint "media_item_tvdb_id_full_title_unique" unique ("tvdb_id", "full_title");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "media_item" drop constraint "media_item_tvdb_id_full_title_unique";`,
    );
  }
}
