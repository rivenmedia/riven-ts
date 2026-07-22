import { transforms } from "@viren070/parse-torrent-title";

import type { Handler } from "@viren070/parse-torrent-title";

export const trashHandlers: Handler[] = [
  {
    field: "trash",
    pattern:
      /\b(?:H[DQ][ .-]*)?CAM(?!.?[SE(]\d+)(?:H[DQ])?(?:[ .-]*Rip|Rp)?\b/iu,
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: /\b(?:H[DQ][ .-]*)?S[ .-]print\b/iu,
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: /\b(?:HD[ .-]*)?T(?:ELE)?[CS](?:INE|YNC)?(?:Rip)?\b/iu,
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: /\bPre.?DVD(?:Rip)?\b/iu,
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: /\b(?:DVD?|BD|BR|HD)?[ .-]*Scr(?:eener)?\b/iu,
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: /\bDVB[ .-]*(?:Rip)?\b/iu,
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: /\bSAT[ .-]*Rips?\b/iu,
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: /\bLeaked\b/iu,
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: /threesixtyp/iu,
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: /\bR5|R6\b/iu,
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: /\bDeleted.*Scenes?\b/iu,
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: /\bHQ.?(?<Clean>Clean)?.?(?<Aud>Aud(?<io>io)?)?\b/iu,
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: /acesse o original/iu,
    transform: transforms.toBoolean(),
    remove: true,
  },
];
