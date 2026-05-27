import { Migration } from "@mikro-orm/migrations";

export class Migration20260527162757 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "media_item" add column "download_kind" text null;`,
    );
    this.addSql(
      `alter table "media_item" add constraint "media_item_download_kind_check" check ("download_kind" in ('torrent', 'nzb'));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "media_item" drop constraint "media_item_download_kind_check";`,
    );
    this.addSql(`alter table "media_item" drop column "download_kind";`);
  }
}
