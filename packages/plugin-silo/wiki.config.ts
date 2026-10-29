import { buildWikiConfig } from "@repo/util-wiki-helpers/build-wiki-config";

export const dir = import.meta.dirname;

const wikiConfig = buildWikiConfig(dir);

export const { docs } = wikiConfig;

export default wikiConfig.config;
