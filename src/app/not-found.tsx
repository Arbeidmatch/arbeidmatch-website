import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-dvh flex-col items-center justify-center bg-[#0D1B2A] px-4 py-16 text-center text-white">
      <div className="mx-auto flex max-w-lg flex-col items-center">
        <p className="text-[clamp(4rem,18vw,7.5rem)] font-extrabold leading-none tracking-tight text-[#C9A84C]">
          404
        </p>
        <h2 className="mt-4 text-2xl font-bold text-white md:text-3xl">Page not found</h2>
        <p className="mt-3 text-base leading-relaxed text-white/65">
          {"The page you're looking for doesn't exist or has been moved."}
        </p>
        <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#C9A84C,#b8953f)] px-6 py-3 text-sm font-bold text-[#0D1B2A] transition-[filter] duration-200 hover:brightness-105 sm:flex-none sm:min-w-[140px]"
          >
            Go home
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-[10px] border border-solid border-[rgba(201,168,76,0.45)] bg-transparent px-6 py-3 text-sm font-semibold text-[#C9A84C] transition-colors duration-200 hover:border-[#C9A84C] hover:bg-[rgba(201,168,76,0.08)] sm:flex-none sm:min-w-[140px]"
          >
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
