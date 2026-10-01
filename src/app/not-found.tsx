import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Nothing in this slot</h1>
      <p className="mt-3 text-muted">The page you were looking for doesn&apos;t exist or was removed.</p>
      <Link href="/" className="btn-primary mt-6">
        Back home
      </Link>
    </div>
  );
}
