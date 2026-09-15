import { words } from "es-toolkit";

export function getInitials(value: string | null | undefined) {
  const wordList = words(value ?? "");

  if (wordList.length === 0) {
    return "";
  }

  if (wordList.length === 1 && wordList[0] && wordList[0].length > 0) {
    return wordList[0].charAt(0).toUpperCase();
  }

  const [[firstInitial = ""] = "", [lastInitial = ""] = ""] = [
    wordList[0],
    wordList.at(-1),
  ];

  return (firstInitial + lastInitial).toUpperCase();
}
