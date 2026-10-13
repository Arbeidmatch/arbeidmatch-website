import type { CityQuestion, ContactPerson } from "@/lib/min-side/profile";
import { telHref } from "@/lib/min-side/profile";
import { BTN_NAVY, BTN_OUTLINE, CARD_L, GOLD_TEXT, INK, MUTED_L, SOFT } from "./ui";

/**
 * ORDER 101, the one-time question (13 October 2026): a client who asked us
 * for a town is asked once, on Min side, whether the alerts should keep only
 * that town. "Ja" sets the town without touching the 30-day rule; "Nei" keeps
 * the whole county. Either answer is recorded by the ATS and the card is gone.
 *
 * Without state of its own: the page holds whether an answer is on its way.
 */
export function MinSideCityQuestion({ question, busy, error, onAnswer }: { question: CityQuestion | null | undefined; busy: boolean; error?: string | null; onAnswer: (answer: "yes" | "no") => void }) {
  if (!question || !question.cities.length) return null;
  const city = question.cities[0];
  const county = question.county;
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-[#E9D9A6] bg-[#FBF6E8] px-[18px] py-4" role="region" aria-labelledby="ms-city-question">
      <p id="ms-city-question" className={`text-[17px] font-bold ${INK}`}>
        Vil dere bare få prosjekter i {city}?
      </p>
      <p className={`text-sm leading-relaxed ${SOFT}`}>
        Dere ba om varsler for hele {city}. Vi kan begrense varslene til {city}, eller dere kan beholde hele {county}.
      </p>
      <div className="flex flex-wrap gap-2.5">
        <button type="button" className={`${BTN_NAVY} text-sm`} disabled={busy} onClick={() => onAnswer("yes")}>
          Ja, bare {city}
        </button>
        <button type="button" className={`${BTN_OUTLINE} text-sm`} disabled={busy} onClick={() => onAnswer("no")}>
          Nei, behold hele {county}
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#B42318]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** "Din kontakt hos oss": our contact person for this client, under the menu. Left out when there is none. */
export function MinSideContactCard({ person }: { person: ContactPerson | null }) {
  if (!person) return null;
  const tel = person.phone ? telHref(person.phone) : null;
  return (
    <div className={`${CARD_L} flex flex-col gap-2.5 p-[18px]`}>
      <p className={`text-[11px] font-bold uppercase tracking-[0.1em] ${GOLD_TEXT}`}>Din kontakt hos oss</p>
      <div className="flex items-center gap-3">
        {person.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.avatar_url} alt={person.name} width={56} height={56} className="h-14 w-14 shrink-0 rounded-full border-2 border-[#E9D9A6] object-cover" style={{ objectPosition: "center 25%" }} />
        ) : null}
        <div className="min-w-0">
          <p className={`break-words text-[15px] font-bold ${INK}`}>{person.name}</p>
          <p className={`mt-0.5 text-[13px] ${MUTED_L}`}>Kontaktperson</p>
        </div>
      </div>
      {person.phone ? <p className={`text-sm tabular-nums ${INK}`}>{person.phone}</p> : null}
      <p className={`text-[13px] ${SOFT}`}>Vi svarer innen én arbeidsdag.</p>
      {tel ? (
        <a href={tel} className={`${BTN_OUTLINE} text-sm`}>
          Ring meg
        </a>
      ) : null}
    </div>
  );
}
