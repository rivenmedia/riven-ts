import { type ClassValue, clsx } from "clsx";
import { words } from "es-toolkit";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(value: string | null | undefined) {
  const wordList = words(value ?? "");

  if (!wordList.length) {
    return "";
  }

  if (wordList.length === 1 && wordList[0] && wordList[0].length > 0) {
    return wordList[0].charAt(0).toUpperCase();
  }

  const [[firstInitial = ""] = "", [lastInitial = ""] = ""] = [
    wordList[0],
    wordList[wordList.length - 1],
  ];

  return (firstInitial + lastInitial).toUpperCase();
}
