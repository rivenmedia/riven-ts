import { Migration } from "@mikro-orm/migrations";

export class Migration20260609214410 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`update "file_system_entry" set "stream_url" = null;`);
    this.addSql(
      `alter table "file_system_entry" rename column "stream_url" to "stream_permalink";`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "file_system_entry" rename column "stream_permalink" to "stream_url";`,
    );
  }
}
