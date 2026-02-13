import { type Handler, transforms } from "@viren070/parse-torrent-title";

export const trashHandlers: Handler[] = [
  {
    field: "trash",
    pattern: new RegExp(
      "\\b(?:H[DQ][ .-]*)?CAM(?!.?(S|E|\\()\\d+)(?:H[DQ])?(?:[ .-]*Rip|Rp)?\\b",
      "i",
    ),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp("\\b(?:H[DQ][ .-]*)?S[ .-]print\\b", "i"),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp(
      "\\b(?:HD[ .-]*)?T(?:ELE)?(C|S)(?:INE|YNC)?(?:Rip)?\\b",
      "i",
    ),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp("\\bPre.?DVD(?:Rip)?\\b", "i"),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp("\\b(?:DVD?|BD|BR|HD)?[ .-]*Scr(?:eener)?\\b", "i"),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp("\\bDVB[ .-]*(?:Rip)?\\b", "i"),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp("\\bSAT[ .-]*Rips?\\b", "i"),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp("\\bLeaked\\b", "i"),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp("threesixtyp", "i"),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp("\\bR5|R6\\b", "i"),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp("\\bDeleted.*Scenes?\\b", "i"),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp("\\bHQ.?(Clean)?.?(Aud(io)?)?\\b", "i"),
    transform: transforms.toBoolean(),
  },
  {
    field: "trash",
    pattern: new RegExp("acesse o original", "i"),
    transform: transforms.toBoolean(),
    remove: true,
  },
];
