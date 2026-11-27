export interface EmptyStateProps {
  message: string;
  description?: string;
  actionText?: string;
  actionFn?: () => void;
}

/**
 * Placeholder message for an empty view, with an optional action button.
 */
export function EmptyState({
  message,
  description,
  actionText,
  actionFn,
}: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <p className="text-muted-foreground text-sm">{message}</p>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-sm text-center text-xs">
          {description}
        </p>
      )}
      {actionText && actionFn && (
        <button
          className="bg-primary/10 hover:bg-primary/20 text-primary mt-4 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          onClick={actionFn}
          type="button"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
