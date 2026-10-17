export const defaultLocale = "en-US";

/**
 * Resolves an `Accept-Language` header to the preferred ISO-compatible locale
 */
export function resolveLocale(acceptLanguage: string | null): string {
  const tags = (acceptLanguage ?? "")
    .split(",")
    .map((entry, index) => {
      const [tag = "", ...params] = entry.trim().split(";");
      const qParam = params.find((param) => param.trim().startsWith("q="));
      const quality = qParam ? Number(qParam.trim().slice(2)) : 1;

      return {
        tag: tag.trim(),
        quality: Number.isNaN(quality) ? 0 : quality,
        index,
      };
    })
    .filter(({ tag, quality }) => tag && tag !== "*" && quality > 0)
    .toSorted((a, b) => b.quality - a.quality || a.index - b.index);

  for (const { tag } of tags) {
    try {
      const locale = new Intl.Locale(tag);

      // TMDB only understands ISO 3166-1 alpha-2 regions, so numeric UN M.49 regions (e.g. es-419)
      // fall back to the most likely region for the language
      const { language, region } = /^[A-Z]{2}$/u.test(locale.region ?? "")
        ? locale
        : new Intl.Locale(locale.language).maximize();

      if (region) {
        return `${language}-${region}`;
      }
    } catch {
      // Invalid language tag; try the next one
    }
  }

  return defaultLocale;
}
