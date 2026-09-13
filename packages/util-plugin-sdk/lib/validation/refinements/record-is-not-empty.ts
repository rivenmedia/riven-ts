export const recordIsNotEmpty = (obj: Record<string, unknown>) =>
  Object.keys(obj).length > 0;
