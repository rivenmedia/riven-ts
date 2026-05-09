import { Migration } from "@mikro-orm/migrations";

export class Migration20260506183307 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "media_item" drop constraint "media_item_active_stream_info_hash_foreign";`,
    );

    this.addSql(
      `alter table "media_item_streams" drop constraint "media_item_streams_stream_info_hash_foreign";`,
    );

    this.addSql(
      `alter table "media_item_blacklisted_streams" drop constraint "media_item_blacklisted_streams_stream_info_hash_foreign";`,
    );

    this.addSql(
      `alter table "item_request" alter column "imdb_id" type varchar(10) using ("imdb_id"::varchar(10));`,
    );
    this.addSql(
      `alter table "item_request" alter column "tmdb_id" type varchar(10) using ("tmdb_id"::varchar(10));`,
    );
    this.addSql(
      `alter table "item_request" alter column "tvdb_id" type varchar(10) using ("tvdb_id"::varchar(10));`,
    );
    this.addSql(
      `alter table "item_request" alter column "requested_by" type text using ("requested_by"::text);`,
    );
    this.addSql(
      `alter table "item_request" alter column "external_request_id" type text using ("external_request_id"::text);`,
    );

    this.addSql(
      `alter table "stream" alter column "info_hash" type text using ("info_hash"::text);`,
    );

    this.addSql(`alter table "media_item" drop column "guid";`);
    this.addSql(
      `alter table "media_item" alter column "title" type text using ("title"::text);`,
    );
    this.addSql(
      `alter table "media_item" alter column "full_title" type text using ("full_title"::text);`,
    );
    this.addSql(
      `alter table "media_item" alter column "imdb_id" type varchar(10) using ("imdb_id"::varchar(10));`,
    );
    this.addSql(
      `alter table "media_item" alter column "poster_path" type text using ("poster_path"::text);`,
    );
    this.addSql(
      `alter table "media_item" alter column "network" type text using ("network"::text);`,
    );
    this.addSql(
      `alter table "media_item" alter column "country" type text using ("country"::text);`,
    );
    this.addSql(
      `alter table "media_item" alter column "language" type text using ("language"::text);`,
    );
    this.addSql(
      `alter table "media_item" alter column "active_stream_info_hash" type text using ("active_stream_info_hash"::text);`,
    );
    this.addSql(
      `alter table "media_item" alter column "tvdb_id" type varchar(10) using ("tvdb_id"::varchar(10));`,
    );
    this.addSql(
      `alter table "media_item" alter column "tmdb_id" type varchar(10) using ("tmdb_id"::varchar(10));`,
    );
    this.addSql(
      `alter table "media_item" add constraint "media_item_active_stream_info_hash_foreign" foreign key ("active_stream_info_hash") references "stream" ("info_hash") on delete set null;`,
    );

    this.addSql(
      `alter table "file_system_entry" alter column "path" type text using ("path"::text);`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "language" type text using ("language"::text);`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "file_hash" type text using ("file_hash"::text);`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "source_provider" type text using ("source_provider"::text);`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "source_id" type text using ("source_id"::text);`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "original_filename" type text using ("original_filename"::text);`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "download_url" type text using ("download_url"::text);`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "stream_url" type text using ("stream_url"::text);`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "plugin" type text using ("plugin"::text);`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "provider" type text using ("provider"::text);`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "provider_download_id" type text using ("provider_download_id"::text);`,
    );

    this.addSql(
      `alter table "media_item_streams" alter column "stream_info_hash" type text using ("stream_info_hash"::text);`,
    );
    this.addSql(
      `alter table "media_item_streams" add constraint "media_item_streams_stream_info_hash_foreign" foreign key ("stream_info_hash") references "stream" ("info_hash") on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table "media_item_blacklisted_streams" alter column "stream_info_hash" type text using ("stream_info_hash"::text);`,
    );
    this.addSql(
      `alter table "media_item_blacklisted_streams" add constraint "media_item_blacklisted_streams_stream_info_hash_foreign" foreign key ("stream_info_hash") references "stream" ("info_hash") on update cascade on delete cascade;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "media_item" drop constraint "media_item_active_stream_info_hash_foreign";`,
    );

    this.addSql(
      `alter table "media_item_streams" drop constraint "media_item_streams_stream_info_hash_foreign";`,
    );

    this.addSql(
      `alter table "media_item_blacklisted_streams" drop constraint "media_item_blacklisted_streams_stream_info_hash_foreign";`,
    );

    this.addSql(
      `alter table "item_request" alter column "imdb_id" type varchar(255) using ("imdb_id"::varchar(255));`,
    );
    this.addSql(
      `alter table "item_request" alter column "tmdb_id" type varchar(255) using ("tmdb_id"::varchar(255));`,
    );
    this.addSql(
      `alter table "item_request" alter column "tvdb_id" type varchar(255) using ("tvdb_id"::varchar(255));`,
    );
    this.addSql(
      `alter table "item_request" alter column "requested_by" type varchar(255) using ("requested_by"::varchar(255));`,
    );
    this.addSql(
      `alter table "item_request" alter column "external_request_id" type varchar(255) using ("external_request_id"::varchar(255));`,
    );

    this.addSql(
      `alter table "stream" alter column "info_hash" type varchar(255) using ("info_hash"::varchar(255));`,
    );

    this.addSql(`alter table "media_item" add "guid" varchar(255) null;`);
    this.addSql(
      `alter table "media_item" alter column "title" type varchar(255) using ("title"::varchar(255));`,
    );
    this.addSql(
      `alter table "media_item" alter column "full_title" type varchar(255) using ("full_title"::varchar(255));`,
    );
    this.addSql(
      `alter table "media_item" alter column "imdb_id" type varchar(255) using ("imdb_id"::varchar(255));`,
    );
    this.addSql(
      `alter table "media_item" alter column "poster_path" type varchar(255) using ("poster_path"::varchar(255));`,
    );
    this.addSql(
      `alter table "media_item" alter column "network" type varchar(255) using ("network"::varchar(255));`,
    );
    this.addSql(
      `alter table "media_item" alter column "country" type varchar(255) using ("country"::varchar(255));`,
    );
    this.addSql(
      `alter table "media_item" alter column "language" type varchar(255) using ("language"::varchar(255));`,
    );
    this.addSql(
      `alter table "media_item" alter column "active_stream_info_hash" type varchar(255) using ("active_stream_info_hash"::varchar(255));`,
    );
    this.addSql(
      `alter table "media_item" alter column "tvdb_id" type varchar(255) using ("tvdb_id"::varchar(255));`,
    );
    this.addSql(
      `alter table "media_item" alter column "tmdb_id" type varchar(255) using ("tmdb_id"::varchar(255));`,
    );
    this.addSql(
      `alter table "media_item" add constraint "media_item_active_stream_info_hash_foreign" foreign key ("active_stream_info_hash") references "stream" ("info_hash") on delete set null;`,
    );

    this.addSql(
      `alter table "file_system_entry" alter column "path" type varchar(255) using ("path"::varchar(255));`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "language" type varchar(255) using ("language"::varchar(255));`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "file_hash" type varchar(255) using ("file_hash"::varchar(255));`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "source_provider" type varchar(255) using ("source_provider"::varchar(255));`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "source_id" type varchar(255) using ("source_id"::varchar(255));`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "original_filename" type varchar(255) using ("original_filename"::varchar(255));`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "download_url" type varchar(255) using ("download_url"::varchar(255));`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "stream_url" type varchar(255) using ("stream_url"::varchar(255));`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "plugin" type varchar(255) using ("plugin"::varchar(255));`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "provider" type varchar(255) using ("provider"::varchar(255));`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "provider_download_id" type varchar(255) using ("provider_download_id"::varchar(255));`,
    );

    this.addSql(
      `alter table "media_item_streams" alter column "stream_info_hash" type varchar(255) using ("stream_info_hash"::varchar(255));`,
    );
    this.addSql(
      `alter table "media_item_streams" add constraint "media_item_streams_stream_info_hash_foreign" foreign key ("stream_info_hash") references "stream" ("info_hash") on update cascade on delete cascade;`,
    );

    this.addSql(
      `alter table "media_item_blacklisted_streams" alter column "stream_info_hash" type varchar(255) using ("stream_info_hash"::varchar(255));`,
    );
    this.addSql(
      `alter table "media_item_blacklisted_streams" add constraint "media_item_blacklisted_streams_stream_info_hash_foreign" foreign key ("stream_info_hash") references "stream" ("info_hash") on update cascade on delete cascade;`,
    );
  }
}
