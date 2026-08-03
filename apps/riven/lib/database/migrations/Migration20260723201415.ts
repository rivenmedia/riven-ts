import { Migration } from "@mikro-orm/migrations";

export class Migration20260723201415 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`drop table if exists "media_item_subtitles" cascade;`);

    this.addSql(
      `alter table "media_item" drop constraint "media_item_item_request_id_foreign";`,
    );

    this.addSql(
      `alter table "file_system_entry" drop constraint "file_system_entry_media_item_id_foreign";`,
    );

    this.addSql(
      `alter table "media_item" add constraint "media_item_item_request_id_foreign" foreign key ("item_request_id") references "item_request" ("id") on delete cascade;`,
    );

    this.addSql(
      `alter table "file_system_entry" add constraint "file_system_entry_media_item_id_foreign" foreign key ("media_item_id") references "media_item" ("id") on delete cascade;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `create table "media_item_subtitles" ("file_system_entry_id" uuid not null, "media_item_id" uuid not null, primary key ("media_item_id", "file_system_entry_id"));`,
    );

    this.addSql(
      `alter table "media_item_subtitles" add constraint "media_item_subtitles_file_system_entry_id_foreign" foreign key ("file_system_entry_id") references "file_system_entry" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "media_item_subtitles" add constraint "media_item_subtitles_media_item_id_foreign" foreign key ("media_item_id") references "media_item" ("id") on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table "file_system_entry" drop constraint "file_system_entry_media_item_id_foreign";`,
    );

    this.addSql(
      `alter table "media_item" drop constraint "media_item_item_request_id_foreign";`,
    );

    this.addSql(
      `alter table "file_system_entry" add constraint "file_system_entry_media_item_id_foreign" foreign key ("media_item_id") references "media_item" ("id");`,
    );

    this.addSql(
      `alter table "media_item" add constraint "media_item_item_request_id_foreign" foreign key ("item_request_id") references "item_request" ("id");`,
    );
  }
}
