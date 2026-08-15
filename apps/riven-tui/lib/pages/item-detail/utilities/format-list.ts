export function formatList(
  values: readonly string[] | null | undefined,
): string {
  return values && values.length > 0 ? values.join(", ") : "—";
}
