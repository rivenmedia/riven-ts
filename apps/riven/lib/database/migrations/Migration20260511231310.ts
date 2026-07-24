import { Migration } from "@mikro-orm/migrations";

export class Migration20260511231310 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "blacklisted_stream" ("stream_info_hash" text not null, "media_item_id" uuid not null, "provider" text null, "plugin" text not null, primary key ("stream_info_hash", "media_item_id", "provider", "plugin"));`,
    );

    this.addSql(
      `alter table "blacklisted_stream" add constraint "blacklisted_stream_stream_info_hash_foreign" foreign key ("stream_info_hash") references "stream" ("info_hash");`,
    );
    this.addSql(
      `alter table "blacklisted_stream" add constraint "blacklisted_stream_media_item_id_foreign" foreign key ("media_item_id") references "media_item" ("id");`,
    );

    this.addSql(
      `drop table if exists "media_item_filesystem_entries" cascade;`,
    );
    this.addSql(
      `drop table if exists "media_item_blacklisted_streams" cascade;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `create table "media_item_filesystem_entries" ("media_item_id" uuid not null, "file_system_entry_id" uuid not null, primary key ("media_item_id", "file_system_entry_id"));`,
    );

    this.addSql(
      `create table "media_item_blacklisted_streams" ("media_item_id" uuid not null, "stream_info_hash" text not null, primary key ("media_item_id", "stream_info_hash"));`,
    );

    this.addSql(
      `alter table "media_item_filesystem_entries" add constraint "media_item_filesystem_entries_media_item_id_foreign" foreign key ("media_item_id") references "media_item" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "media_item_filesystem_entries" add constraint "media_item_filesystem_entries_file_system_entry_id_foreign" foreign key ("file_system_entry_id") references "file_system_entry" ("id") on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table "media_item_blacklisted_streams" add constraint "media_item_blacklisted_streams_media_item_id_foreign" foreign key ("media_item_id") references "media_item" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "media_item_blacklisted_streams" add constraint "media_item_blacklisted_streams_stream_info_hash_foreign" foreign key ("stream_info_hash") references "stream" ("info_hash") on update cascade on delete cascade;`,
    );

    this.addSql(`drop table if exists "blacklisted_stream" cascade;`);
  }
}
