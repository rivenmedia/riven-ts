import { Migration } from "@mikro-orm/migrations";

export class Migration20261108191046 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "ranking_profile" ("id" uuid not null, "slug" text null, "name" text not null, "description" text null, "built_in" boolean not null default false, "ranking_model" jsonb not null default '{}', "settings" jsonb not null default '{}', "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "ranking_profile" add constraint "ranking_profile_slug_unique" unique ("slug");`,
    );
    this.addSql(
      `alter table "ranking_profile" add constraint "ranking_profile_name_unique" unique ("name");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "ranking_profile" cascade;`);
  }
}
