import { Migration } from "@mikro-orm/migrations";

export class Migration20260425123152 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "item_request" ("id" uuid not null, "imdb_id" varchar(255) null, "tmdb_id" varchar(255) null, "tvdb_id" varchar(255) null, "type" text not null, "requested_by" varchar(255) null, "external_request_id" varchar(255) null, "created_at" timestamptz not null, "completed_at" timestamptz null, "state" text not null, "seasons" jsonb null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "item_request" add constraint "item_request_imdb_id_unique" unique ("imdb_id");`,
    );
    this.addSql(
      `alter table "item_request" add constraint "item_request_tmdb_id_unique" unique ("tmdb_id");`,
    );
    this.addSql(
      `alter table "item_request" add constraint "item_request_tvdb_id_unique" unique ("tvdb_id");`,
    );
    this.addSql(
      `alter table "item_request" add constraint "item_request_type_check" check ("type" in ('movie', 'show'));`,
    );
    this.addSql(
      `alter table "item_request" add constraint "item_request_state_check" check ("state" in ('requested', 'completed', 'failed', 'ongoing', 'unreleased'));`,
    );

    this.addSql(
      `create table "stream" ("info_hash" varchar(255) not null, "parsed_data" jsonb not null, primary key ("info_hash"));`,
    );

    this.addSql(
      `create table "media_item" ("id" uuid not null, "title" varchar(255) not null, "full_title" varchar(255) not null, "imdb_id" varchar(255) null, "poster_path" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz null, "indexed_at" timestamptz null, "scraped_at" timestamptz null, "scraped_times" int not null default 0, "aliases" jsonb null, "network" varchar(255) null, "country" varchar(255) null, "language" varchar(255) null, "release_date" timestamptz null, "year" int null, "genres" text[] null, "rating" int null, "content_rating" text null, "guid" varchar(255) null, "state" text not null default 'indexed', "failed_scrape_attempts" int not null default 0, "active_stream_info_hash" varchar(255) null, "type" text not null, "item_request_id" uuid not null, "is_requested" boolean not null, "tvdb_id" varchar(255) null, "absolute_number" int null, "season_id" uuid null, "runtime" int null, "tmdb_id" varchar(255) null, "number" int null, "show_id" uuid null, "is_special" boolean null default false, "status" text null, "next_air_date" timestamptz null, primary key ("id"));`,
    );
    this.addSql(
      `create index "media_item_title_index" on "media_item" ("title");`,
    );
    this.addSql(
      `create index "media_item_created_at_index" on "media_item" ("created_at");`,
    );
    this.addSql(
      `create index "media_item_type_index" on "media_item" ("type");`,
    );
    this.addSql(
      `create index "media_item_type_release_date_index" on "media_item" ("type", "release_date");`,
    );
    this.addSql(
      `alter table "media_item" add constraint "media_item_content_rating_check" check ("content_rating" in ('g', 'pg', 'pg-13', 'r', 'nc-17', 'tv-y', 'tv-y7', 'tv-g', 'tv-pg', 'tv-14', 'tv-ma', 'unknown'));`,
    );
    this.addSql(
      `alter table "media_item" add constraint "media_item_state_check" check ("state" in ('unknown', 'unreleased', 'ongoing', 'indexed', 'scraped', 'downloaded', 'completed', 'partially_completed', 'failed', 'paused'));`,
    );
    this.addSql(
      `alter table "media_item" add constraint "media_item_type_check" check ("type" in ('movie', 'show', 'season', 'episode'));`,
    );
    this.addSql(
      `alter table "media_item" add constraint "media_item_status_check" check ("status" in ('continuing', 'upcoming', 'ended', 'unknown'));`,
    );

    this.addSql(
      `create table "file_system_entry" ("id" uuid not null, "file_size" bigint not null, "created_at" timestamptz not null, "updated_at" timestamptz null, "media_item_id" uuid not null, "type" text not null, "path" varchar(255) not null, "language" varchar(255) null, "parent_original_filename" varchar(255) null, "content" varchar(255) null, "file_hash" varchar(255) null, "video_file_size" int null, "open_subtitles_id" varchar(255) null, "original_filename" varchar(255) null, "download_url" varchar(255) null, "stream_url" varchar(255) null, "plugin" varchar(255) null, "provider" varchar(255) null, "provider_download_id" varchar(255) null, "library_profiles" jsonb null, "media_metadata" jsonb null, primary key ("id"));`,
    );
    this.addSql(
      `create index "file_system_entry_type_index" on "file_system_entry" ("type");`,
    );
    this.addSql(
      `create index "file_system_entry_language_index" on "file_system_entry" ("language");`,
    );
    this.addSql(
      `create index "file_system_entry_original_filename_index" on "file_system_entry" ("original_filename");`,
    );
    this.addSql(
      `alter table "file_system_entry" add constraint "file_system_entry_type_check" check ("type" in ('media', 'subtitle'));`,
    );

    this.addSql(
      `create table "media_item_subtitles" ("media_item_id" uuid not null, "file_system_entry_id" uuid not null, primary key ("media_item_id", "file_system_entry_id"));`,
    );

    this.addSql(
      `create table "media_item_filesystem_entries" ("media_item_id" uuid not null, "file_system_entry_id" uuid not null, primary key ("media_item_id", "file_system_entry_id"));`,
    );

    this.addSql(
      `create table "media_item_streams" ("media_item_id" uuid not null, "stream_info_hash" varchar(255) not null, primary key ("media_item_id", "stream_info_hash"));`,
    );

    this.addSql(
      `create table "media_item_blacklisted_streams" ("media_item_id" uuid not null, "stream_info_hash" varchar(255) not null, primary key ("media_item_id", "stream_info_hash"));`,
    );

    this.addSql(
      `alter table "media_item" add constraint "media_item_active_stream_info_hash_foreign" foreign key ("active_stream_info_hash") references "stream" ("info_hash") on delete set null;`,
    );
    this.addSql(
      `alter table "media_item" add constraint "media_item_item_request_id_foreign" foreign key ("item_request_id") references "item_request" ("id");`,
    );
    this.addSql(
      `alter table "media_item" add constraint "media_item_season_id_foreign" foreign key ("season_id") references "media_item" ("id") on delete set null;`,
    );
    this.addSql(
      `alter table "media_item" add constraint "media_item_show_id_foreign" foreign key ("show_id") references "media_item" ("id") on delete set null;`,
    );

    this.addSql(
      `alter table "file_system_entry" add constraint "file_system_entry_media_item_id_foreign" foreign key ("media_item_id") references "media_item" ("id");`,
    );

    this.addSql(
      `alter table "media_item_subtitles" add constraint "media_item_subtitles_media_item_id_foreign" foreign key ("media_item_id") references "media_item" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "media_item_subtitles" add constraint "media_item_subtitles_file_system_entry_id_foreign" foreign key ("file_system_entry_id") references "file_system_entry" ("id") on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table "media_item_filesystem_entries" add constraint "media_item_filesystem_entries_media_item_id_foreign" foreign key ("media_item_id") references "media_item" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "media_item_filesystem_entries" add constraint "media_item_filesystem_entries_file_system_entry_id_foreign" foreign key ("file_system_entry_id") references "file_system_entry" ("id") on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table "media_item_streams" add constraint "media_item_streams_media_item_id_foreign" foreign key ("media_item_id") references "media_item" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "media_item_streams" add constraint "media_item_streams_stream_info_hash_foreign" foreign key ("stream_info_hash") references "stream" ("info_hash") on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table "media_item_blacklisted_streams" add constraint "media_item_blacklisted_streams_media_item_id_foreign" foreign key ("media_item_id") references "media_item" ("id") on update cascade on delete cascade;`,
    );
    this.addSql(
      `alter table "media_item_blacklisted_streams" add constraint "media_item_blacklisted_streams_stream_info_hash_foreign" foreign key ("stream_info_hash") references "stream" ("info_hash") on update cascade on delete cascade;`,
    );
  }
}
