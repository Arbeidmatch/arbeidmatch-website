import Image from "next/image";
import Link from "next/link";

/**
 * The one header mark for the whole flislegger microsite.
 *
 * WHY IT IS A COMPONENT AND NOT FOUR COPIES. The mark on these pages has been
 * wrong three times, and each time only one page was repaired. It shipped as a
 * white disc with the letter A. On 12 August the landing page was moved to
 * `arbeidmatch-logo.svg`, which turned out to be a placeholder somebody drew,
 * and the three pages underneath kept the disc. On 14 August the landing page
 * got the real gold badge, and the three pages still kept the disc: a customer
 * who opened the portfolio, a single project or the privacy page saw a letter
 * in a circle, on the site he reached with the printed card in his hand.
 *
 * The header markup was duplicated in four files, so repairing the brand meant
 * finding all four and nobody ever did. There is one now, and the next change
 * to the mark is one edit.
 *
 * Every header it sits in is on the dark ground, which is why the rules and the
 * department label are written in whites.
 */
export function FlisleggerBrand() {
  return (
    <Link href="/flislegger" className="inline-flex min-h-11 items-center gap-3" aria-label="Flislegger forside">
      <Image src="/brand/arbeidmatch-emblem.png" alt="" width={36} height={36} className="h-9 w-9" />
      <span className="text-sm font-bold tracking-wide">ArbeidMatch</span>
      <span className="hidden border-l border-white/30 pl-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/65 sm:block">
        Flislegger
      </span>
    </Link>
  );
}
