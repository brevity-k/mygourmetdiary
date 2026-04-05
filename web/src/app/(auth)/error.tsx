'use client';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <h2 className="text-xl font-heading font-semibold text-foreground">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">
          {process.env.NODE_ENV === 'development'
            ? error.message || 'An unexpected error occurred.'
            : 'An unexpected error occurred. Please try again later.'}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
