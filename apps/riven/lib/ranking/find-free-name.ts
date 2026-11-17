/** Returns the first candidate not matched by `exists` */
export async function findFreeName(
  name: string,
  suffix: string,
  exists: (candidate: string) => Promise<boolean> | boolean,
) {
  for (let attempt = 1; ; attempt++) {
    const candidate =
      attempt === 1
        ? `${name} (${suffix})`
        : `${name} (${suffix} ${String(attempt)})`;

    if (!(await exists(candidate))) {
      return candidate;
    }
  }
}
