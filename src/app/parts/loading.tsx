export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-10">
      <div className="h-4 w-24 rounded bg-surface-2" />
      <div className="mt-3 h-8 w-48 rounded bg-surface-2" />
      <div className="mt-6 h-10 rounded-xl bg-surface-2" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
