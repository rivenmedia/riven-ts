import { Migration } from "@mikro-orm/migrations";

export class Migration20260504150643 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "file_system_entry" add constraint "file_system_entry_media_item_id_language_unique" unique ("media_item_id", "language");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "file_system_entry" drop constraint "file_system_entry_media_item_id_language_unique";`,
    );
  }
}
