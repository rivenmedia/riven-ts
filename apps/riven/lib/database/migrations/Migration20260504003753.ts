import { Migration } from "@mikro-orm/migrations";

export class Migration20260504003753 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "file_system_entry" drop column "parent_original_filename", drop column "video_file_size", drop column "open_subtitles_id";`,
    );
    this.addSql(
      `alter table "file_system_entry" add "source_provider" varchar(255) null, add "source_id" varchar(255) null;`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "content" type text using ("content"::text);`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "file_system_entry" drop column "source_provider", drop column "source_id";`,
    );
    this.addSql(
      `alter table "file_system_entry" add "parent_original_filename" varchar(255) null, add "video_file_size" int null, add "open_subtitles_id" varchar(255) null;`,
    );
    this.addSql(
      `alter table "file_system_entry" alter column "content" type varchar(255) using ("content"::varchar(255));`,
    );
  }
}
