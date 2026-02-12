import {
  AUDIO_MAP,
  CODEC_MAP,
  FLAG_MAP,
  HDR_MAP,
  LANG_GROUPS,
  QUALITY_MAP,
  RESOLUTION_MAP,
  RESOLUTION_SETTINGS_MAP,
  TRASH_QUALITIES,
} from "./mappings.ts";
import { getCustomRank } from "./settings.ts";

import type { Settings } from "./settings.ts";
import type { FetchResult, ParsedData } from "./types.ts";

function trashHandler(
  data: ParsedData,
  settings: Settings,
  failed: string[],
): boolean {
  if (!settings.options.removeAllTrash) return false;

  if (data.quality && TRASH_QUALITIES.has(data.quality)) {
    failed.push("trash_quality");
    return true;
  }

  if (data.audio?.includes("HQ Clean Audio")) {
    failed.push("trash_audio");
    return true;
  }

  return false;
}

function checkRequired(data: ParsedData, settings: Settings): boolean {
  if (settings.compiledRequire.length === 0) {
    return false;
  }

  return settings.compiledRequire.some((p) => p.test(data.rawTitle));
}

function checkExclude(
  data: ParsedData,
  settings: Settings,
  failed: string[],
): boolean {
  for (let i = 0; i < settings.compiledExclude.length; i++) {
    const pattern = settings.compiledExclude[i];

    if (pattern?.test(data.rawTitle)) {
      failed.push(`exclude_regex '${settings.exclude[i] ?? ""}'`);
      return true;
    }
  }

  return false;
}

function populateLangs(langs: string[]): Set<string> {
  const expanded = new Set(langs);

  for (const [groupName, groupSet] of Object.entries(LANG_GROUPS)) {
    if (expanded.has(groupName)) {
      for (const lang of groupSet) {
        expanded.add(lang);
      }
    }
  }

  return expanded;
}

function languageHandler(
  data: ParsedData,
  settings: Settings,
  failed: string[],
): boolean {
  const required = populateLangs(settings.languages.required);
  const allowed = populateLangs(settings.languages.allowed);
  const exclude = populateLangs(settings.languages.exclude);

  if (data.languages.length === 0) {
    if (settings.options.removeUnknownLanguages) {
      failed.push("unknown_language");
      return true;
    }

    if (required.size > 0) {
      failed.push("missing_required_language");
      return true;
    }

    return false;
  }

  if (required.size > 0 && !data.languages.some((lang) => required.has(lang))) {
    failed.push("missing_required_language");
    return true;
  }

  if (
    data.languages.includes("en") &&
    settings.options.allowEnglishInLanguages
  ) {
    return false;
  }

  if (allowed.size > 0 && data.languages.some((lang) => allowed.has(lang))) {
    return false;
  }

  const excluded = data.languages.filter((lang) => exclude.has(lang));

  if (excluded.length > 0) {
    for (const lang of excluded) {
      failed.push(`lang_${lang}`);
    }

    return true;
  }

  return false;
}

function fetchResolution(
  data: ParsedData,
  settings: Settings,
  failed: string[],
): boolean {
  if (!data.resolution || data.resolution === "unknown") {
    if (!settings.resolutions.unknown) {
      failed.push("resolution_unknown");
      return true;
    }
    return false;
  }

  const normalizedRes = RESOLUTION_MAP.get(data.resolution) ?? "unknown";

  const settingsKey = RESOLUTION_SETTINGS_MAP.get(normalizedRes) ?? "unknown";

  const enabled = (settings.resolutions as Record<string, boolean>)[
    settingsKey
  ];

  if (!enabled) {
    failed.push("resolution");
    return true;
  }
  return false;
}

function checkFetchMap(
  value: string | undefined,
  map: Map<string, [string, string]>,
  settings: Settings,
  failed: string[],
): boolean {
  if (!value) {
    return false;
  }

  const entry = map.get(value);

  if (!entry) {
    return false;
  }

  const [category, key] = entry;
  const custom = getCustomRank(settings, category, key);

  if (custom && !custom.fetch) {
    failed.push(`${category}_${key}`);
    return true;
  }

  return false;
}

function checkFetchList(
  values: string[],
  map: Map<string, [string, string]>,
  settings: Settings,
  failed: string[],
): boolean {
  for (const v of values) {
    const entry = map.get(v);

    if (!entry) {
      continue;
    }

    const [category, key] = entry;
    const custom = getCustomRank(settings, category, key);

    if (custom && !custom.fetch) {
      failed.push(`${category}_${key}`);
      return true;
    }
  }

  return false;
}

function checkFetchFlags(
  data: ParsedData,
  flagMap: Map<string, [string, string]>,
  settings: Settings,
  failed: string[],
): boolean {
  for (const [field, [category, key]] of flagMap.entries()) {
    const value = (data as unknown as Record<string, unknown>)[field];

    if (!value) {
      continue;
    }

    const custom = getCustomRank(settings, category, key);

    if (custom && !custom.fetch) {
      failed.push(`${category}_${key}`);
      return true;
    }
  }

  return false;
}

export function checkFetch(
  data: ParsedData,
  settings: Settings,
  speedMode = true,
): FetchResult {
  const failed: string[] = [];

  if (speedMode) {
    if (trashHandler(data, settings, failed)) {
      return { fetch: false, failedChecks: failed };
    }

    if (checkRequired(data, settings)) {
      return { fetch: true, failedChecks: [] };
    }

    if (checkExclude(data, settings, failed)) {
      return { fetch: false, failedChecks: failed };
    }

    if (languageHandler(data, settings, failed)) {
      return { fetch: false, failedChecks: failed };
    }

    if (fetchResolution(data, settings, failed)) {
      return { fetch: false, failedChecks: failed };
    }

    if (checkFetchMap(data.quality, QUALITY_MAP, settings, failed)) {
      return { fetch: false, failedChecks: failed };
    }

    if (checkFetchList(data.audio ?? [], AUDIO_MAP, settings, failed)) {
      return { fetch: false, failedChecks: failed };
    }

    if (checkFetchList(data.hdr ?? [], HDR_MAP, settings, failed)) {
      return { fetch: false, failedChecks: failed };
    }

    if (checkFetchMap(data.codec?.toLowerCase(), CODEC_MAP, settings, failed)) {
      return { fetch: false, failedChecks: failed };
    }

    if (checkFetchFlags(data, FLAG_MAP, settings, failed)) {
      return { fetch: false, failedChecks: failed };
    }
  } else {
    trashHandler(data, settings, failed);

    if (!checkRequired(data, settings)) {
      checkExclude(data, settings, failed);
    }

    languageHandler(data, settings, failed);
    fetchResolution(data, settings, failed);
    checkFetchMap(data.quality, QUALITY_MAP, settings, failed);
    checkFetchList(data.audio ?? [], AUDIO_MAP, settings, failed);
    checkFetchList(data.hdr ?? [], HDR_MAP, settings, failed);
    checkFetchMap(data.codec?.toLowerCase(), CODEC_MAP, settings, failed);
    checkFetchFlags(data, FLAG_MAP, settings, failed);
  }

  return {
    fetch: failed.length === 0,
    failedChecks: failed,
  };
}
