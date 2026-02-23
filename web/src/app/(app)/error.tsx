'use client';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <h2 className="text-xl font-heading font-semibold text-foreground">Something went wrong</h2>
      <p className="text-muted-foreground text-sm max-w-md text-center">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
