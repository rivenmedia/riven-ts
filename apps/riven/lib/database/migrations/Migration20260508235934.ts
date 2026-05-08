import { Migration } from "@mikro-orm/migrations";

export class Migration20260508235934 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "item_request" drop constraint "item_request_state_check";`,
    );
    this.addSql(
      `alter table "item_request" add "is_partial_request" boolean not null default false;`,
    );
    this.addSql(
      `alter table "item_request" add constraint "item_request_state_check" check ("state" in ('requested', 'requested_additional_seasons', 'completed', 'failed', 'ongoing', 'unreleased'));`,
    );

    this.addSql(
      `alter table "media_item" alter column "indexed_at" set not null;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "item_request" drop constraint "item_request_state_check";`,
    );
    this.addSql(`alter table "item_request" drop column "is_partial_request";`);
    this.addSql(
      `alter table "item_request" add constraint "item_request_state_check" check ("state" in ('requested', 'completed', 'failed', 'ongoing', 'unreleased'));`,
    );

    this.addSql(
      `alter table "media_item" alter column "indexed_at" drop not null;`,
    );
  }
}
