const translationTable: Record<string, string | null> = {
  ā: "a",
  ă: "a",
  ą: "a",
  ć: "c",
  č: "c",
  ç: "c",
  ĉ: "c",
  ċ: "c",
  ď: "d",
  đ: "d",
  è: "e",
  é: "e",
  ê: "e",
  ë: "e",
  ē: "e",
  ĕ: "e",
  ę: "e",
  ě: "e",
  ĝ: "g",
  ğ: "g",
  ġ: "g",
  ģ: "g",
  ĥ: "h",
  î: "i",
  ï: "i",
  ì: "i",
  í: "i",
  ī: "i",
  ĩ: "i",
  ĭ: "i",
  ı: "i",
  ĵ: "j",
  ķ: "k",
  ĺ: "l",
  ļ: "l",
  ł: "l",
  ń: "n",
  ň: "n",
  ñ: "n",
  ņ: "n",
  ŉ: "n",
  ó: "o",
  ô: "o",
  õ: "o",
  ö: "o",
  ø: "o",
  ō: "o",
  ő: "o",
  œ: "oe",
  ŕ: "r",
  ř: "r",
  ŗ: "r",
  š: "s",
  ş: "s",
  ś: "s",
  ș: "s",
  ß: "ss",
  ť: "t",
  ţ: "t",
  ū: "u",
  ŭ: "u",
  ũ: "u",
  û: "u",
  ü: "u",
  ù: "u",
  ú: "u",
  ų: "u",
  ű: "u",
  ŵ: "w",
  ý: "y",
  ÿ: "y",
  ŷ: "y",
  ž: "z",
  ż: "z",
  ź: "z",
  æ: "ae",
  ǎ: "a",
  ǧ: "g",
  ə: "e",
  ƒ: "f",
  ǐ: "i",
  ǒ: "o",
  ǔ: "u",
  ǚ: "u",
  ǜ: "u",
  ǹ: "n",
  ǻ: "a",
  ǽ: "ae",
  ǿ: "o",
  "!": null,
  "?": null,
  ",": null,
  ".": " ",
  ":": null,
  ";": null,
  "'": null,
  "&": "and",
  _: " ",
};

export function normalizeTitle(rawTitle: string, lower = true): string {
  let text = lower ? rawTitle.toLowerCase() : rawTitle;

  // Normalize unicode characters (NFKC)
  text = text.normalize("NFKC");

  // Apply specific translations
  let translated = "";

  for (const ch of text) {
    if (ch in translationTable) {
      const replacement = translationTable[ch];

      if (replacement != null) {
        translated += replacement;
      }

      // null means remove
    } else {
      translated += ch;
    }
  }

  // Remove non-alphanumeric, non-space characters
  return translated
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}
