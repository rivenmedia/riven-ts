import { Migration } from "@mikro-orm/migrations";

export class Migration20260515025356 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "stream" add "size" bigint null, add "seeders" int null, add "leechers" int null;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "stream" drop column "size", drop column "seeders", drop column "leechers";`,
    );
  }
}
