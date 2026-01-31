export const toFlag = function (flags: number) {
  const parsedFlags = flags & 3;

  if (parsedFlags === 0) {
    return "r";
  }

  if (parsedFlags === 1) {
    return "w";
  }

  return "r+";
};
