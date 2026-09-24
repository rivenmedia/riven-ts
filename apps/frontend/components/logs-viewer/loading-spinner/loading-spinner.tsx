export interface LoadingSpinnerProps {
  message: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
