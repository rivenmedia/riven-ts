export type QueryState<TData> =
  | { status: "error"; error: Error }
  | { status: "loading" }
  | { status: "success"; data: TData };

export function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
