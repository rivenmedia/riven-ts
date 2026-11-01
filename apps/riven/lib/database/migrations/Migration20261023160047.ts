import { Migration } from "@mikro-orm/migrations";

export class Migration20261023160047 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`create schema if not exists "auth_db";`);
    this.addSql(
      `create table "auth_db"."user" ("id" uuid not null, "name" text not null, "email" text not null, "email_verified" boolean not null default false, "image" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "username" text null, "display_username" text null, "role" text null, "banned" boolean not null default false, "ban_reason" text null, "ban_expires" timestamptz null, "last_login_method" text null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "auth_db"."user" add constraint "user_email_unique" unique ("email");`,
    );
    this.addSql(
      `alter table "auth_db"."user" add constraint "user_username_unique" unique ("username");`,
    );

    this.addSql(
      `create table "auth_db"."session" ("id" uuid not null, "expires_at" timestamptz not null, "token" text not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "ip_address" text null, "user_agent" text null, "impersonated_by" text null, "user_id" uuid not null, primary key ("id"));`,
    );
    this.addSql(
      `create index "session_id_index" on "auth_db"."session" ("id");`,
    );
    this.addSql(
      `alter table "auth_db"."session" add constraint "session_token_unique" unique ("token");`,
    );

    this.addSql(
      `create table "auth_db"."passkey" ("id" uuid not null, "name" text null, "public_key" text not null, "credential_id" text not null, "counter" int not null, "device_type" text not null, "backed_up" boolean not null default false, "transports" jsonb null, "created_at" timestamptz not null, "aaguid" text null, "user_id" uuid not null, primary key ("id"));`,
    );
    this.addSql(
      `create index "passkey_credential_id_index" on "auth_db"."passkey" ("credential_id");`,
    );
    this.addSql(
      `create index "passkey_user_id_index" on "auth_db"."passkey" ("user_id");`,
    );

    this.addSql(
      `create table "auth_db"."account" ("id" uuid not null, "account_id" text not null, "provider_id" text not null, "access_token" text null, "refresh_token" text null, "id_token" text null, "access_token_expires_at" timestamptz null, "refresh_token_expires_at" timestamptz null, "scope" text null, "issuer" text null, "password" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "user_id" uuid not null, primary key ("id"));`,
    );
    this.addSql(
      `create index "account_user_id_index" on "auth_db"."account" ("user_id");`,
    );

    this.addSql(
      `create table "auth_db"."verification" ("id" uuid not null, "identifier" text not null, "value" text not null, "expires_at" timestamptz not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `create index "verification_identifier_index" on "auth_db"."verification" ("identifier");`,
    );

    this.addSql(
      `alter table "auth_db"."session" add constraint "session_user_id_foreign" foreign key ("user_id") references "auth_db"."user" ("id");`,
    );

    this.addSql(
      `alter table "auth_db"."passkey" add constraint "passkey_user_id_foreign" foreign key ("user_id") references "auth_db"."user" ("id");`,
    );

    this.addSql(
      `alter table "auth_db"."account" add constraint "account_user_id_foreign" foreign key ("user_id") references "auth_db"."user" ("id");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "auth_db"."session" drop constraint "session_user_id_foreign";`,
    );
    this.addSql(
      `alter table "auth_db"."passkey" drop constraint "passkey_user_id_foreign";`,
    );
    this.addSql(
      `alter table "auth_db"."account" drop constraint "account_user_id_foreign";`,
    );

    this.addSql(`drop table if exists "auth_db"."user" cascade;`);
    this.addSql(`drop table if exists "auth_db"."session" cascade;`);
    this.addSql(`drop table if exists "auth_db"."passkey" cascade;`);
    this.addSql(`drop table if exists "auth_db"."account" cascade;`);
    this.addSql(`drop table if exists "auth_db"."verification" cascade;`);

    this.addSql(`drop schema if exists "auth_db";`);
  }
}
