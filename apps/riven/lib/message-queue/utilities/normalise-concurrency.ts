/**
 * Normalises a concurrency value to ensure it is a positive integer.
 *
 * @param concurrency The concurrency for a job
 * @returns The normalised concurrency. This will always be an integer of at least 1.
 */
export function normaliseConcurrency(concurrency: number) {
  return Math.max(1, Math.floor(concurrency));
}
