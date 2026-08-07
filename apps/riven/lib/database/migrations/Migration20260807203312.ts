import { Migration } from "@mikro-orm/migrations";

export class Migration20260807203312 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `update "item_request" set "state" = 'requested' where "state" = 'requested_additional_seasons';`,
    );

    this.addSql(
      `alter table "item_request" drop constraint "item_request_state_check";`,
    );
    this.addSql(
      `alter table "item_request" add constraint "item_request_state_check" check ("state" in ('requested', 'completed', 'failed', 'ongoing', 'unreleased', 'processing', 'paused'));`,
    );

    this.addSql(
      `update "media_item" set "state" = 'indexed' where "state" = 'ongoing';`,
    );
    this.addSql(
      `update "media_item" set "state" = 'failed' where "state" = 'unknown';`,
    );
    this.addSql(
      `update "media_item" episode set "show_id" = season."show_id", "is_special" = season."is_special" from "media_item" season where episode."type" = 'episode' and episode."season_id" = season."id";`,
    );

    this.addSql(
      `alter table "media_item" drop constraint "media_item_state_check";`,
    );
    this.addSql(
      `alter table "media_item" add constraint "media_item_state_check" check ("state" in ('unreleased', 'indexed', 'scraped', 'downloaded', 'completed', 'partially_completed', 'failed', 'paused'));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `update "item_request" set "state" = 'ongoing' where "state" = 'processing' and exists (select 1 from "media_item" where "media_item"."item_request_id" = "item_request"."id" and "media_item"."type" = 'show' and "media_item"."status" = 'continuing');`,
    );
    this.addSql(
      `update "item_request" set "state" = 'requested' where "state" = 'processing' and not exists (select 1 from "media_item" where "media_item"."item_request_id" = "item_request"."id" and "media_item"."type" = 'show' and "media_item"."status" = 'continuing');`,
    );
    this.addSql(
      `update "item_request" set "state" = 'requested' where "state" = 'paused';`,
    );

    this.addSql(
      `alter table "item_request" drop constraint "item_request_state_check";`,
    );
    this.addSql(
      `alter table "item_request" add constraint "item_request_state_check" check ("state" in ('requested', 'requested_additional_seasons', 'completed', 'failed', 'ongoing', 'unreleased'));`,
    );

    this.addSql(
      `alter table "media_item" drop constraint "media_item_state_check";`,
    );
    this.addSql(
      `alter table "media_item" add constraint "media_item_state_check" check ("state" in ('unknown', 'unreleased', 'ongoing', 'indexed', 'scraped', 'downloaded', 'completed', 'partially_completed', 'failed', 'paused'));`,
    );
  }
}
