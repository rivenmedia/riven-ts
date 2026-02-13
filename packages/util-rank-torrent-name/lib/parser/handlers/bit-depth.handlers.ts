import { type Handler, transforms } from "@viren070/parse-torrent-title";

export const bitDepthHandlers: Handler[] = [
  {
    field: "bitDepth",
    pattern: new RegExp("\\bhevc\\s?10\\b", "i"),
    transform: transforms.toValue("10bit"),
  },
  {
    field: "bitDepth",
    pattern: new RegExp("(?:8|10|12)[-\\.]?(?=bit\\b)", "i"),
    transform: (match) => `${match}bit`,
    remove: true,
  },
  {
    field: "bitDepth",
    pattern: new RegExp("\\bhdr10\\b", "i"),
    transform: transforms.toValue("10bit"),
  },
  {
    field: "bitDepth",
    pattern: new RegExp("\\bhi10\\b", "i"),
    transform: transforms.toValue("10bit"),
  },
  {
    field: "bitDepth",
    process: (_title, meta, result) => {
      const bitDepth = result.get("bitDepth");

      if (bitDepth?.value && typeof bitDepth.value === "string") {
        meta.value = bitDepth.value.replace(" ", "").replace("-", "");

        if (!String(meta.value).endsWith("bit")) {
          meta.value = `${String(meta.value)}bit`;
        }
      }

      return meta;
    },
  },
];
