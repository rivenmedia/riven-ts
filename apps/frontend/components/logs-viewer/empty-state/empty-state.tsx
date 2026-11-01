export interface EmptyStateProps {
  message: string;
  actionText?: string;
  actionFn?: () => void;
}

/**
 * Placeholder message for an empty log view, with an optional action button.
 */
export function EmptyState({ message, actionText, actionFn }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <p className="text-muted-foreground text-sm">{message}</p>
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
