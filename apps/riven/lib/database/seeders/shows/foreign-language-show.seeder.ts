import { BaseSeeder } from "../base.seeder.ts";
import {
  IndexedShowSeeder,
  type IndexedShowSeederContext,
} from "./indexed-show.seeder.ts";

import type { EntityManager } from "@mikro-orm/core";

export class ForeignLanguageShowSeeder extends BaseSeeder<IndexedShowSeederContext> {
  async run(
    em: EntityManager,
    context: IndexedShowSeederContext = this.context,
  ) {
    await this.call(em, [IndexedShowSeeder], context);

    em.persist(context.show);

    em.assign(context.show, {
      title: "海外のショー",
      language: "jp",
      aliases: {
        en: ["Foreign Show"],
        es: ["Espectáculo Extranjero"],
        fr: ["Spectacle Étranger"],
      },
    });
  }
}
