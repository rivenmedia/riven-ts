import { createFromSource } from "fumadocs-core/search/server";

import { source } from "#lib/source.ts";

export const dynamic = "force-static";
export const revalidate = false;

const search = createFromSource(source);

export const GET = search.staticGET;
