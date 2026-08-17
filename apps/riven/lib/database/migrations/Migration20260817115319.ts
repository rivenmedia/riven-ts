import { Migration } from "@mikro-orm/migrations";

export class Migration20260817115319 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "blacklisted_stream" drop constraint "blacklisted_stream_media_item_id_foreign";`,
    );
    this.addSql(
      `alter table "blacklisted_stream" drop constraint "blacklisted_stream_stream_info_hash_foreign";`,
    );

    this.addSql(
      `alter table "blacklisted_stream" add constraint "blacklisted_stream_media_item_id_foreign" foreign key ("media_item_id") references "media_item" ("id") on delete cascade;`,
    );
    this.addSql(
      `alter table "blacklisted_stream" add constraint "blacklisted_stream_stream_info_hash_foreign" foreign key ("stream_info_hash") references "stream" ("info_hash") on delete cascade;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "blacklisted_stream" drop constraint "blacklisted_stream_stream_info_hash_foreign";`,
    );
    this.addSql(
      `alter table "blacklisted_stream" drop constraint "blacklisted_stream_media_item_id_foreign";`,
    );

    this.addSql(
      `alter table "blacklisted_stream" add constraint "blacklisted_stream_stream_info_hash_foreign" foreign key ("stream_info_hash") references "stream" ("info_hash");`,
    );
    this.addSql(
      `alter table "blacklisted_stream" add constraint "blacklisted_stream_media_item_id_foreign" foreign key ("media_item_id") references "media_item" ("id");`,
    );
  }
}
