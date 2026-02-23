export const recordIsNotEmpty = (obj: Record<string, unknown>) => {
  return Object.keys(obj).length > 0;
};
