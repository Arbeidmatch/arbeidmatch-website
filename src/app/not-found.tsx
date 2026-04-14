import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center bg-surface px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-navy">Page not found</h1>
        <p className="mt-3 text-text-secondary">The page you are looking for does not exist.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-gold px-6 py-3 font-medium text-white hover:bg-gold-hover"
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}
