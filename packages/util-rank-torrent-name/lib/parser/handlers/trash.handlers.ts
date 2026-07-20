import { transforms } from "@viren070/parse-torrent-title";

import type { Handler } from "@viren070/parse-torrent-title";

export const trashHandlers: Handler[] = [
  {
    field: "trash",
    pattern: new RegExp(
      String.raw`\b(?:H[DQ][ .-]*)?CAM(?!.?(S|E|\()\d+)(?:H[DQ])?(?:[ .-]*Rip|Rp)?\b`,
      "i",
    ),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp(String.raw`\b(?:H[DQ][ .-]*)?S[ .-]print\b`, "i"),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp(
      String.raw`\b(?:HD[ .-]*)?T(?:ELE)?(C|S)(?:INE|YNC)?(?:Rip)?\b`,
      "i",
    ),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp(String.raw`\bPre.?DVD(?:Rip)?\b`, "i"),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp(
      String.raw`\b(?:DVD?|BD|BR|HD)?[ .-]*Scr(?:eener)?\b`,
      "i",
    ),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp(String.raw`\bDVB[ .-]*(?:Rip)?\b`, "i"),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp(String.raw`\bSAT[ .-]*Rips?\b`, "i"),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp(String.raw`\bLeaked\b`, "i"),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp("threesixtyp", "i"),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp(String.raw`\bR5|R6\b`, "i"),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp(String.raw`\bDeleted.*Scenes?\b`, "i"),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp(String.raw`\bHQ.?(Clean)?.?(Aud(io)?)?\b`, "i"),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp("acesse o original", "i"),
    transform: transforms.toBoolean(),
    remove: true,
  },
];
