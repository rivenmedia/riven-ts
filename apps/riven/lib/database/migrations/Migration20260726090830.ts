import { Migration } from "@mikro-orm/migrations";

export class Migration20260726090830 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "library_section" ("id" uuid not null, "name" text not null, "slug" varchar(64) not null, "media_types" jsonb not null, "split" boolean not null default true, "rule" jsonb null, "enabled" boolean not null default true, "sort_order" int not null default 0, "created_at" timestamptz not null, "updated_at" timestamptz null, primary key ("id"));`,
    );
    this.addSql(
      `create index "library_section_slug_index" on "library_section" ("slug");`,
    );
    this.addSql(
      `alter table "library_section" add constraint "library_section_slug_unique" unique ("slug");`,
    );

    this.addSql(
      `create table "library_section_override" ("id" uuid not null, "section_id" uuid not null, "media_item_id" uuid not null, "mode" text not null, "created_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "library_section_override" add constraint "library_section_override_section_id_media_item_id_unique" unique ("section_id", "media_item_id");`,
    );

    this.addSql(
      `alter table "library_section_override" add constraint "library_section_override_section_id_foreign" foreign key ("section_id") references "library_section" ("id") on delete cascade;`,
    );
    this.addSql(
      `alter table "library_section_override" add constraint "library_section_override_media_item_id_foreign" foreign key ("media_item_id") references "media_item" ("id") on delete cascade;`,
    );
    this.addSql(
      `alter table "library_section_override" add constraint "library_section_override_mode_check" check ("mode" in ('include', 'exclude'));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "library_section_override" drop constraint "library_section_override_section_id_foreign";`,
    );

    this.addSql(`drop table if exists "library_section" cascade;`);
    this.addSql(`drop table if exists "library_section_override" cascade;`);
  }
}
