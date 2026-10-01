"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="eyebrow">Error</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Something tripped a breaker</h1>
      <p className="mt-3 text-muted">We couldn&apos;t load this page. Try again in a moment.</p>
      <button onClick={reset} className="btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}
