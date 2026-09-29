import styles from "@/components/prosjekter/portal.module.css";
import { COUNTIES, COUNTY_CODES, MAP_H, MAP_W, STAGE_HEX, type PlacedProject } from "@/lib/prosjekter/map";

/**
 * "Slik fungerer det": the four steps from the open map to a whole project,
 * each with a small picture of what the visitor gets. The pictures are
 * examples, drawn here, and hidden from screen readers; the step text says it.
 */

const CHECK = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 8.5l3 3 7-7" fill="none" stroke="#c9a84c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function MiniMap({ projects }: { projects: PlacedProject[] }) {
  return (
    <svg className={styles.miniMap} viewBox={`-20 -10 ${MAP_W + 40} ${MAP_H + 20}`} preserveAspectRatio="xMidYMid meet">
      {COUNTY_CODES.map((code) => {
        const on = code === "NO060";
        return (
          <path
            key={code}
            d={COUNTIES[code].d}
            fill={on ? "#24466f" : "#16304d"}
            stroke={on ? "#c9a84c" : "#2b4468"}
            strokeWidth={on ? 1.4 : 0.6}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {projects.slice(0, 400).map((p) => (
        <circle key={p.no} cx={p.x} cy={p.y} r={9} fill={STAGE_HEX[p.st]} />
      ))}
    </svg>
  );
}

export default function PortalSteps({ projects }: { projects: PlacedProject[] }) {
  return (
    <section className={styles.band} id="slik" aria-labelledby="slik-h">
      <div className={styles.wrap}>
        <div className={styles.secHead}>
          <div>
            <p className={styles.eyebrow}>For bedrifter</p>
            <h2 id="slik-h">Slik fungerer det</h2>
          </div>
          <p>
            Fra kartet til riktig konkurranse i fire steg. Du velger selv hvilke fylker og fag du vil følge, og hvor ofte du
            vil høre fra oss.
          </p>
        </div>
        <ol className={styles.steps}>
          <li className={styles.step}>
            <div className={styles.stepCard}>
              <div className={styles.stepNo}>
                <span className={styles.stepN}>1</span>
                <span className={styles.stepLine} />
                <span className={styles.stepFree}>Gratis</span>
              </div>
              <h3>Se prosjektene i ditt område</h3>
              <p>Kartet er åpent. Filtrer på fylke, fag og fase, uten konto.</p>
              <div className={styles.mini} aria-hidden="true">
                <MiniMap projects={projects} />
              </div>
            </div>
          </li>
          <li className={styles.step}>
            <div className={styles.stepCard}>
              <div className={styles.stepNo}>
                <span className={styles.stepN}>2</span>
                <span className={styles.stepLine} />
              </div>
              <h3>Be om tilgang</h3>
              <p>Et kort skjema: firma, org.nr., e-post, fylker og fag. Er dere allerede kunde hos oss, får dere en invitasjon.</p>
              <div className={styles.mini} aria-hidden="true">
                <div className={styles.miniF}>
                  <span>Firma</span>
                  <span>Eksempel Elektro AS</span>
                </div>
                <div className={styles.miniF}>
                  <span>Org.nr.</span>
                  <span className={styles.num}>912 345 678</span>
                </div>
                <div className={styles.miniF}>
                  <span>Fylker</span>
                  <span>Trøndelag, Nordland</span>
                </div>
                <div className={styles.miniF}>
                  <span>Fag</span>
                  <span>Elektro</span>
                </div>
              </div>
            </div>
          </li>
          <li className={styles.step}>
            <div className={styles.stepCard}>
              <div className={styles.stepNo}>
                <span className={styles.stepN}>3</span>
                <span className={styles.stepLine} />
              </div>
              <h3>Få din personlige lenke</h3>
              <p>Velg fylker, fag og hvor ofte du vil få varsler.</p>
              <div className={styles.mini} aria-hidden="true">
                <div className={styles.miniLbl}>Fylker</div>
                <div className={styles.miniChips}>
                  <i className={styles.on}>Trøndelag</i>
                  <i className={styles.on}>Nordland</i>
                  <i>Troms</i>
                  <i>Møre og Romsdal</i>
                </div>
                <div className={styles.miniLbl}>Varsler</div>
                <div className={styles.miniChips}>
                  <i>Daglig</i>
                  <i className={styles.on}>Ukentlig</i>
                  <i>Månedlig</i>
                </div>
              </div>
            </div>
          </li>
          <li className={styles.step}>
            <div className={styles.stepCard}>
              <div className={styles.stepNo}>
                <span className={styles.stepN}>4</span>
                <span className={styles.stepLine} />
              </div>
              <h3>Se hele prosjektet</h3>
              <p>Byggherre, entreprenør, frister og krav. Gå rett til konkurransen, eller be oss om folk til jobben.</p>
              <div className={styles.mini} aria-hidden="true">
                <div className={styles.miniF}>
                  <span>Byggherre</span>
                  <span>
                    <i className={styles.redact} style={{ width: 92 }} />
                  </span>
                </div>
                <div className={styles.miniF}>
                  <span>Entreprenør</span>
                  <span>
                    <i className={styles.redact} style={{ width: 70 }} />
                  </span>
                </div>
                <div className={styles.miniF}>
                  <span>Tilbudsfrist</span>
                  <span>
                    <i className={styles.redact} style={{ width: 84 }} />
                  </span>
                </div>
                <div className={styles.miniF}>
                  <span>Krav</span>
                  <span>Kvalifikasjon, HMS</span>
                </div>
                <div className={styles.miniActs}>
                  <span className={styles.miniA1}>Gå til konkurransen ↗</span>
                  <span className={styles.miniA2}>Trenger dere folk?</span>
                </div>
              </div>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}

export function AccessPerks() {
  return (
    <ul className={styles.perks}>
      {[
        "Byggherre og entreprenør på hvert prosjekt",
        "Eksakte frister, krav og konkurransegrunnlag",
        "Varsler daglig, ukentlig eller månedlig",
        "Folk til jobben når dere vinner den",
      ].map((t) => (
        <li key={t}>
          {CHECK}
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}
