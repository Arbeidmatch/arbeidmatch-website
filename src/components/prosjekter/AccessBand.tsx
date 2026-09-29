import styles from "@/components/prosjekter/portal.module.css";
import { AccessPerks } from "@/components/prosjekter/PortalSteps";
import { STAFFING_AREA_NO } from "@/lib/prosjekter/staffingArea";

/**
 * "Be om tilgang" on /prosjekter: what access gives, and two ways on. The
 * forms themselves open in a dialog (the owner's decision of 29 September
 * 2026: no forms written into pages), through the links to #tilgang and
 * #logg-inn that PortalDialogs answers.
 */
export default function AccessBand() {
  return (
    <section className={styles.band} aria-labelledby="tilgang-h">
      <div className={styles.wrap}>
        <div className={styles.cta}>
          <div className={styles.accessSide}>
            <p className={styles.eyebrow}>Be om tilgang</p>
            <h2 id="tilgang-h">Få hele bildet for ditt område</h2>
            <p>
              Fortell oss hvem dere er og hva dere følger med på. Vi går gjennom forespørselen og sender dere en personlig
              lenke.
            </p>
            <AccessPerks />
            <p className={styles.ctaArea}>{STAFFING_AREA_NO}</p>
          </div>
          <div className={styles.ctaActs}>
            <a href="#tilgang" className={`${styles.btn} ${styles.btnGold}`} aria-haspopup="dialog">
              Be om tilgang
            </a>
            <p className={styles.small} style={{ margin: 0 }}>
              Har dere tilgang allerede?{" "}
              <a href="#logg-inn" className={styles.linkGold} aria-haspopup="dialog">
                Logg inn
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
