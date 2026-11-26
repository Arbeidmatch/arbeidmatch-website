import Link from "next/link";

import { Icon } from "@/components/site/Icon";
import { marketCardView } from "@/lib/market-jobs/pure";
import type { MarketSiteCard } from "@/lib/market-jobs/types";

/**
 * A job from the Norwegian market, in the same card frame as our own jobs
 * (ORDER 514, board 1 of the approved mockup). No photograph: a header with
 * the trade and its Norwegian name, so the card never reads as if ArbeidMatch
 * were the employer. The employer is "local employer" and nothing more.
 */
export function MarketJobCard({ card, privateTest = false }: { card: MarketSiteCard; privateTest?: boolean }) {
  const v = marketCardView(card, privateTest);
  return (
    <Link className="jc mjc" href={v.href}>
      <span className="mjc-h">
        {v.privateTest ? <span className="mj-test">Private test</span> : null}
        <Icon name="wrench" />
        <span className="mjc-t">{v.tradeEn}</span>
        {v.tradeNo ? <span className="mjc-no" lang="nb">Norwegian: {v.tradeNo}</span> : null}
      </span>
      <span className="jc-b">
        <span className="mjc-top">
          <span className="mjc-tr">{v.tradeEn}</span>
          <span className="mjc-id">{v.idLine}</span>
        </span>
        <h3>{v.title}</h3>
        <p>{v.placeLine}</p>
        {v.perks.length > 0 ? (
          <span className="mjc-perks">
            <Icon name="check" />
            {v.perks.join(", ")}
          </span>
        ) : null}
        <span className="jc-m">EU/EEA{v.applyBy ? `, apply by ${v.applyBy}` : ""}</span>
        <span className="jc-f">
          <span>{v.pay ?? ""}</span>
          <Icon name="arrow" />
        </span>
        {v.badges.length > 0 ? (
          <span className="mj-badges">
            {v.badges.map((b) => (
              <span key={b.label} className={`mj-badge ${b.tone}`}>
                {b.label}
              </span>
            ))}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
