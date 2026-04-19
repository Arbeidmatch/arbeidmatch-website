"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import styles from "./DsbCompleteGuide.module.css";

const GOLD = "#C9A84C";
const NAVY = "#0f1923";

interface ProfessionRow {
  profession: string;
  scope: string;
}

const PROFESSION_ROWS: ProfessionRow[] = [
  {
    profession: "Electrician (low-voltage)",
    scope:
      "Electrical low-voltage systems in residential, commercial and industrial buildings",
  },
  {
    profession: "Automation electrician",
    scope: "Electrical low-voltage installations in automation systems",
  },
  {
    profession: "Automation mechanic",
    scope: "Low-voltage installations in hydraulic and pneumatic automation systems",
  },
  {
    profession: "Power-supply fitter electrician",
    scope: "Low and high-voltage power distribution grids, transformer substations",
  },
  {
    profession: "Power-supply operator",
    scope: "Monitoring and operating low and high-voltage power distribution systems",
  },
  {
    profession: "Lift electrician",
    scope: "Electrical installations for lift systems",
  },
  {
    profession: "Power line electrician",
    scope: "Low and high-voltage overhead power transmission lines",
  },
  {
    profession: "Train electrician",
    scope: "Low and high-voltage installations on railways and trams",
  },
  {
    profession: "Electrical equipment repairer",
    scope: "Repair of electrical equipment",
  },
  {
    profession: "Repairer of electro-medical devices",
    scope: "Repair of electro-medical devices in classes IIa, IIb and III",
  },
  {
    profession: "Professional responsibility (design)",
    scope: "Professional responsibility for design of electrical installations",
  },
  {
    profession: "Professional responsibility (contractor)",
    scope:
      "Professional responsibility for design, installation and maintenance of electrical installations owned by others",
  },
];

function IconExternalLink({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path
        d="M15 3h6v6M10 14L21 3"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExternalAnchor({
  href,
  children,
  className = "",
  textSize = "text-xs",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  textSize?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 font-medium text-[#C9A84C] underline underline-offset-2 ${textSize} ${className}`}
    >
      <span>{children}</span>
      <IconExternalLink className="shrink-0 text-[#C9A84C]" />
    </a>
  );
}

function IconWarningTriangle() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5L3 19h18L12 5z"
        stroke={GOLD}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path d="M12 10v4M12 17h.01" stroke={GOLD} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function IconShieldCheck({ className }: { className?: string }) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7l8-4z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function IconFileText({ className }: { className?: string }) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6M8 13h8M8 17h6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.5} />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function IconZap({ className }: { className?: string }) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconServer({ className }: { className?: string }) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="6" rx="1" stroke="currentColor" strokeWidth={1.5} />
      <rect x="3" y="12" width="18" height="6" rx="1" stroke="currentColor" strokeWidth={1.5} />
      <path d="M7 6h.01M7 15h.01" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function IconAnchor({ className }: { className?: string }) {
  return (
    <svg className={className} width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth={1.5} />
      <path d="M12 7v14M5 12h14" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function cardBaseClass(hover: boolean) {
  const base =
    "rounded-[14px] border-[0.5px] border-white/[0.08] bg-white/[0.04] transition-[border-color,transform] duration-200";
  const pad = "p-5 md:p-7 md:px-6";
  const hov = hover
    ? "md:hover:-translate-y-0.5 md:hover:border-[rgba(201,168,76,0.4)]"
    : "";
  return `${base} ${pad} ${hov}`;
}

function LegalDisclaimer() {
  return (
    <div
      className="mb-10 md:mb-12 rounded-[10px] border-l-[3px] border-solid pl-5 pr-5 py-5 md:pl-6 md:pr-6 md:py-5"
      style={{
        borderLeftColor: GOLD,
        backgroundColor: "rgba(201,168,76,0.06)",
      }}
      role="region"
      aria-label="Important legal notice"
    >
      <div className="flex gap-3">
        <div className="shrink-0 pt-0.5">
          <IconWarningTriangle />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-[13px] font-semibold leading-none"
            style={{ color: GOLD }}
          >
            Important Legal Notice
          </p>
          <p
            className="mt-3 text-[13px] leading-[1.7]"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            The information in this guide is based on publicly available regulations from the Norwegian Directorate for
            Civil Protection (DSB), the Norwegian Maritime Authority (NMA), and official Norwegian law as of April 2026.
            This content is provided for informational purposes only and does not constitute legal advice. Regulations may
            change. Always verify current requirements directly with DSB before making employment or compliance decisions.
            ArbeidMatch accepts no legal liability for decisions made based on this guide.
          </p>
          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]" style={{ color: GOLD }}>
            <span>Sources:</span>
            <ExternalAnchor href="https://www.dsb.no" textSize="text-[12px]">
              DSB.no
            </ExternalAnchor>
            <span className="text-white/40">|</span>
            <ExternalAnchor href="https://www.lovdata.no" textSize="text-[12px]">
              Lovdata.no
            </ExternalAnchor>
            <span className="text-white/40">|</span>
            <ExternalAnchor href="https://www.sdir.no" textSize="text-[12px]">
              NMA (Sdir.no)
            </ExternalAnchor>
          </p>
        </div>
      </div>
    </div>
  );
}

function useIntersectionVisible(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setVisible(true);
        });
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, visible]);

  return { ref, visible };
}

interface AccordionBlockProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  open: boolean;
  onToggle: () => void;
  buttonId: string;
  panelId: string;
}

function AccordionBlock({
  title,
  icon,
  children,
  open,
  onToggle,
  buttonId,
  panelId,
}: AccordionBlockProps) {
  return (
    <div className="mb-2 rounded-[10px] border-[0.5px] border-white/10 last:mb-0">
      <button
        type="button"
        id={buttonId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex min-h-[44px] w-full items-center gap-3 rounded-[10px] px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
      >
        {icon ? <span className="shrink-0">{icon}</span> : null}
        <span className="flex-1 text-[15px] font-semibold text-white">{title}</span>
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          className={`shrink-0 text-white/50 ${styles.chevron} ${open ? styles.chevronOpen : ""}`}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
        </svg>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`${styles.accordionGrid} ${open ? styles.accordionGridOpen : ""}`}
      >
        <div className={styles.accordionInner}>
          <div className="border-t border-white/[0.06] px-4 pb-4 pt-1 text-[13px] leading-[1.7] text-white/65">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function IconXCircle({ animate }: { animate: boolean }) {
  return (
    <svg width={40} height={40} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle
        cx="24"
        cy="24"
        r="18"
        stroke="#E24B4A"
        strokeWidth={1.75}
        fill="none"
        className={animate ? styles.strokeDrawCircle : undefined}
        pathLength={120}
      />
      <path
        d="M18 18l12 12M30 18L18 30"
        stroke="#E24B4A"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconClockHands({ color }: { color: string }) {
  return (
    <svg width={40} height={40} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="18" stroke={color} strokeWidth={1.75} />
      <line
        x1="24"
        y1="24"
        x2="24"
        y2="14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        className={styles.clockHandHr}
      />
      <line
        x1="24"
        y1="24"
        x2="32"
        y2="24"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        className={styles.clockHandMin}
      />
    </svg>
  );
}

function IconCheckDraw({ animate }: { animate: boolean }) {
  return (
    <svg width={40} height={40} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="18" stroke="#1D9E75" strokeWidth={1.75} />
      <path
        d="M16 24l6 6 10-14"
        stroke="#1D9E75"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className={animate ? styles.strokeDrawCheck : ""}
        pathLength={100}
      />
    </svg>
  );
}

function TabApproval({ tabActive }: { tabActive: boolean }) {
  return (
    <div>
      <h2 className="text-[28px] font-extrabold leading-[1.2] text-white">
        DSB Approval for EU/EEA Electricians
      </h2>
      <p className="mt-2 text-[13px] font-medium uppercase tracking-wide text-[#C9A84C]">
        Verified information from DSB.no, updated April 2026
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className={`${cardBaseClass(true)} border-t-[3px] border-t-[#E24B4A]`}>
          <div className={tabActive ? styles.fadeUpStagger : "opacity-100"} style={{ animationDelay: "0ms" }}>
            <IconXCircle animate={tabActive} />
            <p className="mt-4 text-[15px] font-semibold text-white">No Application Submitted</p>
            <span
              className="mt-2 inline-block rounded-[20px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ background: "rgba(226,75,74,0.12)", color: "#E24B4A" }}
            >
              Not Legal
            </span>
            <p className="mt-3 text-[13px] leading-[1.7] text-white/65">
              The candidate cannot perform any electrical work in Norway. A DSB application must be submitted and
              approved before any work begins. Performing electrical work without approval may result in fines and
              criminal liability under the Electrical Supervision Act.
            </p>
          </div>
        </div>

        <div
          className={`${cardBaseClass(true)} border-t-[3px] border-t-[#C9A84C]`}
        >
          <div className={tabActive ? styles.fadeUpStagger : "opacity-100"} style={{ animationDelay: "120ms" }}>
            <IconClockHands color={GOLD} />
            <p className="mt-4 text-[15px] font-semibold text-white">Application Submitted, Awaiting Decision</p>
            <span
              className="mt-2 inline-block rounded-[20px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ background: "rgba(201,168,76,0.12)", color: GOLD }}
            >
              Pending, DSB responds within 1 month
            </span>
            <p className="mt-3 text-[13px] leading-[1.7] text-white/65">
              The candidate has submitted a notification for temporary service provision. DSB must respond within 1 month
              of receiving a complete application. Only after a positive decision may the candidate start work legally.
              This applies to temporary approval only (maximum 12 months).
            </p>
            <p className="mt-2 text-[11px] italic text-[#C9A84C]">Source: Altinn.no and DSB FEK regulation</p>
          </div>
        </div>

        <div
          className={`${cardBaseClass(true)} border-t-[3px] border-t-[#1D9E75]`}
        >
          <div className={tabActive ? styles.fadeUpStagger : "opacity-100"} style={{ animationDelay: "240ms" }}>
            <IconCheckDraw animate={tabActive} />
            <p className="mt-4 text-[15px] font-semibold text-white">Temporary Approval Active</p>
            <span
              className="mt-2 inline-block rounded-[20px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ background: "rgba(29,158,117,0.12)", color: "#1D9E75" }}
            >
              Legal, max 12 months
            </span>
            <p className="mt-3 text-[13px] leading-[1.7] text-white/65">
              The candidate holds an active temporary DSB approval. Work can begin immediately. Temporary approval is
              granted for a maximum of 12 months and is specific to the type and duration of work described in the project
              description submitted to DSB.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#C9A84C]">Approval Types</p>
          <ul className="mt-3 space-y-2 text-[14px] text-white">
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84C]" aria-hidden />
              <span>
                Permanent establishment approval: valid indefinitely, processing up to 4 months
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84C]" aria-hidden />
              <span>
                Temporary cross-border service approval: valid max 12 months, processing up to 2 months, DSB initial
                response within 1 month
              </span>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#C9A84C]">
            Application Fees from January 2025
          </p>
          <ul className="mt-3 space-y-2 text-[14px] text-white">
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84C]" aria-hidden />
              <span>First profession: NOK 3,200</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84C]" aria-hidden />
              <span>Each additional profession in same application: NOK 2,400</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84C]" aria-hidden />
              <span>Renewal of temporary notification: no new fee required</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84C]" aria-hidden />
              <span>Payment must be completed before DSB starts processing</span>
            </li>
          </ul>
          <p className="mt-3 text-[11px] italic text-white/40">Source: DSB.no fee announcement, January 2025</p>
        </div>
      </div>

      <h3 className="mb-4 mt-12 text-base font-semibold text-white">
        Regulated Electrical Professions Covered by DSB
      </h3>
      <div className="overflow-x-auto rounded-[10px] border-[0.5px] border-white/[0.08]">
        <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="bg-white/[0.03]">
              <th className="border-[0.5px] border-white/[0.08] px-4 py-3 font-semibold text-[#C9A84C]">Profession</th>
              <th className="border-[0.5px] border-white/[0.08] px-4 py-3 font-semibold text-[#C9A84C]">
                Scope of Work
              </th>
            </tr>
          </thead>
          <tbody>
            {PROFESSION_ROWS.map((row, i) => (
              <tr key={row.profession} className={i % 2 === 0 ? "bg-white/[0.03]" : "bg-transparent"}>
                <td className="border-[0.5px] border-white/[0.08] px-4 py-3 text-white">{row.profession}</td>
                <td className="border-[0.5px] border-white/[0.08] px-4 py-3 text-white/65">{row.scope}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IconUserGold() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="text-[#C9A84C]" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function IconGradCap() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="text-[#C9A84C]" aria-hidden>
      <path d="M22 10L12 5 2 10l10 5 10-5z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M6 12v5c0 2 3 4 6 4s6-2 6-4v-5" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function IconAward() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="text-[#C9A84C]" aria-hidden>
      <circle cx="12" cy="8" r="6" stroke="currentColor" strokeWidth={1.5} />
      <path d="M8.5 13.5L6 20l3-1 3 2 3-2 3 1-2.5-6.5" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="text-[#C9A84C]" aria-hidden>
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth={1.5} />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function IconPassport() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="text-[#C9A84C]" aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth={1.5} />
      <path d="M8 16h8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function TabDocuments() {
  const base = useId();
  const [open, setOpen] = useState<string | null>("d1");

  const toggle = useCallback((id: string) => {
    setOpen((prev) => (prev === id ? null : id));
  }, []);

  const items: { id: string; title: string; icon: ReactNode; body: string }[] = [
    {
      id: "d1",
      title: "CV with Dated Education and Experience",
      icon: <IconUserGold />,
      body:
        "A CV describing biographical data, dated education history, and dated relevant practical experience in the specific electrical profession for which approval is sought. All dates must be clearly stated. Experience gained in Norway does not count toward the minimum requirement.",
    },
    {
      id: "d2",
      title: "Diploma or School Report",
      icon: <IconGradCap />,
      body:
        "Copy of the original diploma or school report including a complete list of subjects, transcript of grades, and curriculum from the education. Both the original and a certified translation (if not in English, Swedish or Danish) must be included.",
    },
    {
      id: "d3",
      title: "Trade Certificate or Craft Certificate",
      icon: <IconAward />,
      body:
        "Copy of the original trade certificate, craft certificate, journeyman certificate, or equivalent attestation of competence in the relevant electrical profession. Both original and certified translation required.",
    },
    {
      id: "d4",
      title: "Employer References, Minimum 1 Year Practice in Last 10 Years",
      icon: <IconBriefcase />,
      body:
        "Copies of original references from current or former employers proving at least 1 year of practical experience in the electrical profession during the previous 10 years after graduation. For this DSB pathway, qualifying practice must be documented from employment outside Norway, as required by the applicable regulations. Both original and certified translation required.",
    },
    {
      id: "d5",
      title: "Valid Passport and Project Description (for Temporary Approval)",
      icon: <IconPassport />,
      body:
        "Copy of a valid passport. For temporary service provision only: a project description specifying the nature of the work, duration, frequency, regularity, and continuity. DSB uses this information to determine whether the work qualifies as temporary. Also required: attestation that the candidate is legally established in their home EU/EEA member state and is not prohibited from practicing.",
    },
  ];

  return (
    <div>
      <h2 className="text-[28px] font-extrabold leading-[1.2] text-white">Required Documents Checklist</h2>
      <p className="mt-2 text-[12px] font-semibold uppercase tracking-wide text-[#C9A84C]">
        For EU/EEA Applicants, sourced from DSB.no
      </p>

      <div
        className="mt-8 rounded-[10px] border-l-[3px] border-solid pl-5 pr-5 py-5 md:pl-6 md:pr-6"
        style={{ borderLeftColor: GOLD, backgroundColor: "rgba(201,168,76,0.06)" }}
      >
        <p className="text-[13px] leading-[1.7] text-white/65">
          All documents must be submitted in PDF format. Documents in languages other than English, Swedish or Danish must
          be translated by a certified translator. DSB will not process incomplete applications.
        </p>
      </div>

      <div className="mt-8">
        {items.map((it) => (
          <AccordionBlock
            key={it.id}
            title={it.title}
            icon={it.icon}
            open={open === it.id}
            onToggle={() => toggle(it.id)}
            buttonId={`${base}-${it.id}-btn`}
            panelId={`${base}-${it.id}-panel`}
          >
            {it.body}
          </AccordionBlock>
        ))}
      </div>

      <div className="mt-10 rounded-xl bg-white/[0.04] p-5 md:p-6">
        <p className="text-[15px] font-semibold text-white">Verify an Electrician&apos;s Registration in Norway</p>
        <p className="mt-2 text-[13px] leading-[1.7] text-white/60">
          The official DSB enterprise register lists all approved electrical enterprises in Norway. Employers should
          always verify candidates here before hiring.
        </p>
        <a
          href="https://elvirksomhetsregisteret.dsb.no"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#C9A84C] px-6 py-3 text-[13px] font-semibold text-[#0f1923] transition-opacity hover:opacity-95"
        >
          Open DSB enterprise register
          <IconExternalLink className="text-[#0f1923]" />
        </a>
      </div>
    </div>
  );
}

function TabTimeline({ tabActive }: { tabActive: boolean }) {
  const base = useId();
  const [faqOpen, setFaqOpen] = useState<string | null>(null);
  const toggleFaq = useCallback((id: string) => {
    setFaqOpen((p) => (p === id ? null : id));
  }, []);

  const steps = [
    {
      id: "s1",
      dot: "gold" as const,
      badge: "Day 1",
      title: "Submit Complete Application via DSB Portal",
      body:
        "Submit all required documents in PDF format via profapp.dsb.no. Pay the processing fee (NOK 3,200 for first profession) before submission. DSB will not begin processing until payment is confirmed and the application is complete.",
      link: { href: "https://profapp.dsb.no/profapp/", label: "Go to DSB Application Portal" },
    },
    {
      id: "s2",
      dot: "gold" as const,
      badge: "Within 1 Month",
      title: "DSB Confirms Receipt",
      body:
        "DSB must confirm receipt of the application within 1 month and notify the applicant of any missing documents. If the application is incomplete, the processing clock does not start until all documents are received.",
    },
    {
      id: "s3",
      dot: "gold" as const,
      badge: "Within 2 Months (Temporary)",
      title: "Decision on Temporary Approval",
      body:
        "For temporary service provision, DSB must issue a decision within 2 months of receiving a complete application. A positive decision allows the candidate to begin work immediately. DSB may request additional information during this period.",
    },
    {
      id: "s4",
      dot: "green" as const,
      badge: "Within 4 Months (Permanent)",
      title: "Decision on Permanent Approval",
      body:
        "For permanent establishment in Norway, DSB must process the application within 3 months of receiving a complete application. In practice, the total process including document gathering takes up to 4 months. The response is sent as a formal letter to the applicant.",
    },
    {
      id: "s5",
      dot: "white" as const,
      badge: "Ongoing",
      title: "Work Legally in Norway",
      body:
        "The candidate may now work legally within the approved profession and installation type. Temporary approval is valid for a maximum of 12 months. For permanent employment, permanent approval is recommended. The employer must ensure the candidate is registered in the DSB enterprise register.",
    },
  ];

  const faqs = [
    {
      id: "f1",
      q: "Can the candidate start work while the application is being processed?",
      a: "No. For permanent approval, the candidate cannot begin work until DSB issues a positive decision. For temporary service provision, DSB may in some cases allow the candidate to begin work without further review of qualifications, but only after DSB explicitly confirms this in writing. Never assume permission without written confirmation from DSB.",
    },
    {
      id: "f2",
      q: "What happens if DSB rejects the application?",
      a: "The applicant has the right to appeal the decision under chapter VI of the Norwegian Public Administration Act. The appeal deadline is 3 weeks from the date the decision letter is received. DSB may request additional documentation or a compensation measure (aptitude test or adaptation period) if qualifications are partially recognized.",
    },
    {
      id: "f3",
      q: "Is Norwegian language required?",
      a: "Language requirements depend on the type of work. Candidates establishing permanently in Norway face stricter language requirements due to client contact. For temporary service provision, language requirements are assessed based on the specific duties involved. Aptitude tests and adaptation periods, if required, are conducted in Norwegian.",
    },
  ];

  const dotClass = (d: "gold" | "green" | "white") => {
    if (d === "gold") return "border-2 border-[#C9A84C] bg-[#0f1923]";
    if (d === "green") return "border-2 border-[#1D9E75] bg-[#0f1923]";
    return "border-2 border-white/40 bg-white/10";
  };

  return (
    <div>
      <h2 className="text-[28px] font-extrabold leading-[1.2] text-white">Processing Timeline</h2>
      <p className="mt-2 text-[12px] font-semibold uppercase tracking-wide text-[#C9A84C]">
        From application submission to legal work start
      </p>

      <div className="relative mt-10 pl-2">
        <div className="absolute bottom-4 left-[15px] top-4 w-px overflow-hidden bg-white/10" aria-hidden>
          <div
            className={`h-full w-full origin-top bg-[#C9A84C] ${tabActive ? styles.timelineLine : ""}`}
            style={{ transform: tabActive ? undefined : "scaleY(1)" }}
          />
        </div>

        <ul className="relative space-y-10">
          {steps.map((st, idx) => (
            <li
              key={st.id}
              className={`relative flex gap-4 pl-8 ${tabActive ? styles.timelineStep : "opacity-100"}`}
              style={tabActive ? { animationDelay: `${idx * 150}ms` } : undefined}
            >
              <span
                className={`absolute left-0 top-1.5 z-[1] h-4 w-4 shrink-0 rounded-full ${dotClass(st.dot)}`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <span
                  className="inline-block rounded-[20px] border border-[#C9A84C] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#C9A84C]"
                >
                  {st.badge}
                </span>
                <p className="mt-2 text-[15px] font-semibold text-white">{st.title}</p>
                <p className="mt-2 text-[13px] leading-[1.7] text-white/65">{st.body}</p>
                {"link" in st && st.link ? (
                  <p className="mt-2">
                    <ExternalAnchor href={st.link.href} textSize="text-xs">
                      {st.link.label}
                    </ExternalAnchor>
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <h3 className="mb-4 mt-14 text-base font-semibold text-white">Frequently asked questions</h3>
      <div>
        {faqs.map((f) => (
          <AccordionBlock
            key={f.id}
            title={f.q}
            open={faqOpen === f.id}
            onToggle={() => toggleFaq(f.id)}
            buttonId={`${base}-${f.id}-btn`}
            panelId={`${base}-${f.id}-panel`}
          >
            {f.a}
          </AccordionBlock>
        ))}
      </div>
    </div>
  );
}

function IconBookOpen({ className }: { className?: string }) {
  return (
    <svg className={className} width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth={1.5} />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <path d="M12 6v14" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={1.5} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function IconAlertTri({ className }: { className?: string }) {
  return (
    <svg className={className} width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5L3 19h18L12 5z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M12 10v4M12 17h.01" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7l8-4z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconZapOff({ className }: { className?: string }) {
  return (
    <svg className={className} width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12.5 2 4 14h6l-1 8 9-12h-6l2-8z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M2 2l20 20" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function TabFse({ tabActive }: { tabActive: boolean }) {
  const items = [
    {
      icon: <IconBookOpen className="text-[#C9A84C]" />,
      title: "Annual FSE Safety Training (FSE Section 7)",
      body:
        "All persons working on or near live electrical installations must complete annual FSE safety training. This is mandatory and must include first aid for electric shock. The training interval must not exceed 12 months. The employer is responsible for ensuring training takes place and is properly documented.",
    },
    {
      icon: <IconUsers className="text-[#C9A84C]" />,
      title: "Roles Under FSE",
      body:
        "FSE defines mandatory operational roles. LFS is the safety leader for high-voltage installations. AFA is the responsible person for work on low-voltage installations. LFK is the switching leader required when switching operations are performed in high-voltage installations. Only the LFS may authorize the start of work in high-voltage installations. These roles must be formally assigned by the installation owner or employer.",
    },
    {
      icon: <IconAlertTri className="text-[#C9A84C]" />,
      title: "Risk Assessment and Work Planning (FSE Sections 10 and 12)",
      body:
        "Every electrical work task must be sufficiently planned before starting. A risk assessment must be conducted to determine the appropriate working method: dead working (voltage-free), live working, or work in proximity to live parts. The employer must implement all necessary safety measures.",
    },
    {
      icon: <IconShield className="text-[#C9A84C]" />,
      title: "Compliance Standard: NEK EN 50110-1",
      body:
        "DSB recognizes the current version of NEK EN 50110-1 as the preferred method for meeting FSE safety requirements. This standard is aligned with the EU/EEA harmonized standard EN 50110-1 and is mandatory reading for all electrical safety managers and workers in Norway.",
    },
    {
      icon: <IconZapOff className="text-[#C9A84C]" />,
      title: "Five-Point Safety Procedure for Dead Working",
      body:
        "When working on de-energized installations, the following five steps must be completed in order: 1. Disconnect the installation from all sources of energy. 2. Prevent re-energization (lock-out/tag-out). 3. Verify that the installation is de-energized using approved test equipment. 4. Apply full earthing and short-circuiting at all points from which voltage could be applied. 5. Provide protection against adjacent live parts.",
    },
  ];

  return (
    <div>
      <h2 className="text-[28px] font-extrabold leading-[1.2] text-white">
        FSE Regulation: Safety at Work on Electrical Installations
      </h2>
      <p className="mt-2 text-[12px] font-semibold uppercase tracking-wide text-[#C9A84C]">
        Regulation on safety for work on and operation of electrical installations, last amended January 2024
      </p>

      <div
        className="mt-8 rounded-[14px] border-[0.5px] border-white/[0.08] bg-[#0a1219] p-5 md:p-6"
        style={{ borderLeft: `3px solid ${GOLD}` }}
      >
        <p className="text-[13px] leading-[1.7] text-white/65">
          FSE (Safety Regulations for Work on and Operation of Electrical Installations) is the mandatory safety framework
          that applies to all persons working on or near electrical installations in Norway. It applies regardless of
          whether the worker holds a DSB approval. Compliance with FSE is the responsibility of the installation owner and
          the employer.
        </p>
      </div>

      <p className="mt-10 text-[12px] font-semibold uppercase tracking-wide text-[#C9A84C]">What FSE requires</p>
      <ul className="mt-4 space-y-4">
        {items.map((it, i) => (
          <li
            key={it.title}
            className={`flex gap-4 rounded-[14px] border-[0.5px] border-white/[0.08] bg-white/[0.04] p-4 md:p-5 ${tabActive ? styles.fseListItem : "opacity-100"}`}
            style={tabActive ? { animationDelay: `${i * 120}ms` } : undefined}
          >
            <span className="shrink-0 pt-0.5">{it.icon}</span>
            <div>
              <p className="text-[15px] font-semibold text-white">{it.title}</p>
              <p className="mt-2 text-[13px] leading-[1.7] text-white/65">{it.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col gap-2 text-[12px]">
        <ExternalAnchor href="https://lovdata.no/dokument/SF/forskrift/2006-04-28-458">FSE full text (Lovdata)</ExternalAnchor>
        <ExternalAnchor href="https://www.dsb.no/elsikkerhet/hms-og-elulykker/veiledning-til-forskrift-om-sikkerhet-ved-arbeid-i-og-drift-av-elektriske-anlegg/">
          DSB FSE guidance
        </ExternalAnchor>
        <ExternalAnchor href="https://standard.no/fagomrader/elektrofag/elektrotekniske-standarder-fra-NEK/sikkerhet-ved-arbeid-i-og-drift-av-elektriske-anlegg--nek-en-50110-1/">
          NEK EN 50110-1 standard
        </ExternalAnchor>
      </div>
    </div>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} width={32} height={32} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 7h18s-3 0-3-7" stroke="currentColor" strokeWidth={1.5} />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function IconCheckSquare({ className }: { className?: string }) {
  return (
    <svg className={className} width={32} height={32} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={1.5} />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function IconDatabase({ className }: { className?: string }) {
  return (
    <svg className={className} width={32} height={32} viewBox="0 0 24 24" fill="none" aria-hidden>
      <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth={1.5} />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke="currentColor" strokeWidth={1.5} />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function IconUserCheck({ className }: { className?: string }) {
  return (
    <svg className={className} width={32} height={32} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={1.5} />
      <path d="M19 8l2 2 4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

interface DcCardProps {
  title: string;
  icon: ReactNode;
  body: string;
  link?: { href: string; label: string };
  animatePulse?: boolean;
  delayMs: number;
  visible: boolean;
}

function DatacenterCard({ title, icon, body, link, animatePulse, delayMs, visible }: DcCardProps) {
  return (
    <div
      className={`${cardBaseClass(true)} ${visible ? styles.fadeUpIOVisible : styles.fadeUpIO}`}
      style={{ transitionDelay: visible ? `${delayMs}ms` : "0ms" }}
    >
      <div className={animatePulse && visible ? styles.pulseOnce : undefined}>{icon}</div>
      <p className="mt-4 text-[15px] font-semibold text-white">{title}</p>
      <p className="mt-2 text-[13px] leading-[1.7] text-white/65">{body}</p>
      {link ? (
        <p className="mt-3">
          <ExternalAnchor href={link.href}>{link.label}</ExternalAnchor>
        </p>
      ) : null}
    </div>
  );
}

function TabDatacenter() {
  const { ref, visible } = useIntersectionVisible(0.15);

  const cards: Omit<DcCardProps, "visible">[] = [
    {
      title: "DSB Approval: High-Voltage Specification Required",
      icon: <IconZap className="text-[#C9A84C]" />,
      body:
        "When applying for DSB approval for datacenter work, the application must explicitly state that the work involves high-voltage installations. DSB processes high-voltage and low-voltage approvals separately. The professional responsibility application must specify whether the candidate will hold responsibility for high-voltage or low-voltage installations, or both. Source: DSB EU/EEA application guidance.",
      link: { href: "https://profapp.dsb.no/profapp/", label: "DSB Application Portal" },
      animatePulse: true,
      delayMs: 0,
    },
    {
      title: "Notification Obligation Under FEF Section 3-3",
      icon: <IconBell className="text-[#C9A84C]" />,
      body:
        "New datacenter electrical installations with high-voltage connections must be notified to the local network operator (DLE) under FEF section 3-3. DSB has specifically listed data storage facilities among the facility types requiring this notification when connecting to high-voltage supply. This is in addition to, not a replacement for, DSB approval of personnel qualifications.",
      link: { href: "https://lovdata.no/dokument/SF/forskrift/1998-12-11-1099", label: "FEF regulation (Lovdata)" },
      delayMs: 120,
    },
    {
      title: "FSE Compliance in Datacenter Environments",
      icon: <IconServer className="text-[#C9A84C]" />,
      body:
        "All electrical work in datacenters is subject to full FSE compliance. This includes mandatory annual safety training, formal assignment of LFS (Safety Leader for high-voltage) and AFA roles, documented risk assessments before each work task, and five-step dead-working procedure for any de-energized work. The installation owner (the datacenter operator) bears primary responsibility for ensuring FSE compliance by all contractors.",
      delayMs: 240,
    },
    {
      title: "NEK 400:2022 Standard Compliance",
      icon: <IconCheckSquare className="text-[#C9A84C]" />,
      body:
        "All low-voltage electrical installations in datacenters must comply with NEK 400:2022, the current Norwegian standard for low-voltage electrical installations. NEK 400:2022 replaced NEK 400:2018 as the mandatory standard from 1 July 2022. Installations completed under the 2018 version had to be finalized by end of 2023. For large or special projects, a dispensation could be requested from DSB.",
      link: {
        href: "https://www.dsb.no/elsikkerhet/elektriske-anlegg-og-utstyr/overgangsregler-for-nek-400/",
        label: "NEK 400 transition rules (DSB)",
      },
      delayMs: 360,
    },
    {
      title: "FEK registration: DSB enterprise register",
      icon: <IconDatabase className="text-[#C9A84C]" />,
      body:
        "Any enterprise performing electrical installation, maintenance, or related services at a datacenter must be registered in the DSB enterprise register. This applies to all contractors, including foreign subcontractors. Failure to register is illegal under Norwegian law and may result in suspension of registration and financial penalties.",
      link: { href: "https://elvirksomhetsregisteret.dsb.no", label: "DSB enterprise register" },
      delayMs: 480,
    },
    {
      title: "Qualified responsible person under FEK",
      icon: <IconUserCheck className="text-[#C9A84C]" />,
      body:
        "Every registered enterprise must appoint a qualified responsible person who holds the relevant DSB approval for the type of work being performed. This person is responsible for ensuring all electrical work complies with Norwegian regulations. If the responsible person is absent for more than 30 days, the enterprise must notify DSB.",
      link: { href: "https://www.dsb.no/elsikkerhet/", label: "DSB guidance on the qualified responsible person" },
      delayMs: 600,
    },
  ];

  return (
    <div>
      <h2 className="text-[28px] font-extrabold leading-[1.2] text-white">
        Electrical Requirements for Datacenter Projects in Norway
      </h2>
      <p className="mt-2 text-[12px] font-semibold uppercase tracking-wide text-[#C9A84C]">
        High-voltage installations, DSB oversight, and additional authorizations
      </p>

      <div className={`mt-8 ${cardBaseClass(false)}`}>
        <p className="text-[13px] leading-[1.7] text-white/65">
          Datacenter projects in Norway typically involve high-voltage electrical installations. DSB has explicitly
          identified data storage facilities as a category subject to notification obligations under the Regulation on
          Electrical Supply Installations (FEF section 3-3). This means additional requirements apply beyond
          standard DSB approval.
        </p>
      </div>

      <div ref={ref} className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <DatacenterCard key={c.title} {...c} visible={visible} />
        ))}
      </div>

      <Link
        href="/request"
        className="mt-10 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-[#C9A84C] px-6 py-3 text-center text-[13px] font-semibold text-[#0f1923] transition-opacity hover:opacity-95"
      >
        Request a DSB-Approved Electrician for Your Datacenter Project
      </Link>
    </div>
  );
}

function IconWaves({ className }: { className?: string }) {
  return (
    <svg className={className} width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke="currentColor" strokeWidth={1.5} />
      <path d="M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function IconRepeat({ className }: { className?: string }) {
  return (
    <svg className={className} width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M17 1l4 4-4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" stroke="currentColor" strokeWidth={1.5} />
      <path d="M7 23l-4-4 4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={1.5} />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function IconShip({ className }: { className?: string }) {
  return (
    <svg className={className} width={28} height={28} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2 21l2-7h16l2 7M4 14h16" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M6 14V8h12v6" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function IconLifeBuoy({ className }: { className?: string }) {
  return (
    <svg className={className} width={28} height={28} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.5} />
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function IconRadio({ className }: { className?: string }) {
  return (
    <svg className={className} width={28} height={28} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth={1.5} />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.48M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function TabNaval({ tabActive }: { tabActive: boolean }) {
  const navalSteps = [
    {
      title: "DSB Approval: Maritime Electrical Work",
      icon: <IconAnchor className="text-[#C9A84C]" />,
      body:
        "Electricians working on the electrical installations of Norwegian-registered vessels must hold DSB approval in the relevant electrical profession. The application process is identical to land-based approval. However, the application must specify that the work involves maritime electrical installations. DSB oversees compliance with maritime electrical installation regulations for certain vessel categories.",
      source: "Source: DSB electrical safety overview (DSB.no)",
    },
    {
      title: "FSE Compliance on Board: IEC 60092-509",
      icon: <IconWaves className="text-[#C9A84C]" />,
      body:
        "The FSE regulation applies to electrical work on Norwegian ships. However, for maritime installations, DSB recognizes IEC 60092-509 (International Standard for Shipboard Electrical Installations) as the compliance reference, equivalent to how NEK EN 50110-1 is used for land-based installations. Compliance with IEC 60092-509 is considered evidence that FSE requirements are met.",
      source: "Source: NMA Circular on FSE and HSE Regulations, Sdir.no",
      link: {
        href: "https://www.sdir.no/en/circulars/guidelines-on-requirement-for-safety-training-related-to-the-operation-and-maintenance-of-electrical-installations-on-board-norwegian-ships/",
        label: "NMA Circular on Safety Training for Ships",
      },
    },
    {
      title: "Annual FSE Training Required on Board",
      icon: <IconRepeat className="text-[#C9A84C]" />,
      body:
        "Persons working on board Norwegian ships who carry out duties related to the operation or maintenance of the ship electrical installations must receive FSE training, practice, and instruction annually. The training interval must not exceed 12 months and must include first aid for electric shock. The company (shipowner or operator) is responsible for ensuring all relevant crew members complete this training before accessing high-risk electrical areas.",
      source: "Source: HSE Regulations section 2-6, FSE Regulation section 7, NMA Circular",
    },
    {
      title: "Maritime Electrical Documentation Requirements",
      icon: <IconFileText className="text-[#C9A84C]" />,
      body:
        "The Norwegian Regulations Relating to Maritime Electrical Installations require the shipowner, owner, or contractor to document the execution, operation, and maintenance of the ship electrical installation. DSB provides specific forms for this purpose. Documentation must be available for inspection by DSB.",
      link: {
        href: "https://www.dsb.no/en/Electrical-safety/maritime-elektriske-anlegg/Documentation-requirements-for-maritime-facilities/",
        label: "DSB Maritime Documentation Requirements",
      },
    },
    {
      title: "DSB Inspection: Norwegian-Registered Vessels",
      icon: <IconSearch className="text-[#C9A84C]" />,
      body:
        "DSB conducts inspections on board Norwegian-registered unclassified cargo ships, lighters, fishing and catching vessels, and unclassified and classified passenger ships registered in the Norwegian ordinary ship register. DSB verifies compliance with FEK and FSE during these inspections, with a specific focus on FSE section 7 annual training documentation and LFS qualification control for high-voltage installations.",
      source: "Source: DSB electrical safety inspection overview 2025 (DSB.no)",
    },
  ];

  return (
    <div>
      <h2 className="text-[28px] font-extrabold leading-[1.2] text-white">
        Electrical Requirements for Maritime and Naval Projects in Norway
      </h2>
      <p className="mt-2 text-[12px] font-semibold uppercase tracking-wide text-[#C9A84C]">
        Norwegian Maritime Authority (NMA) and DSB regulations for ship electrical installations
      </p>

      <div className={`mt-8 ${cardBaseClass(false)}`}>
        <p className="text-[13px] leading-[1.7] text-white/65">
          Maritime electrical installations on Norwegian-registered vessels are governed by a separate regulatory
          framework. While DSB oversees land-based electrical safety, the Norwegian Maritime Authority (NMA) and DSB
          jointly regulate maritime electrical work. The applicable safety standard is IEC 60092-509 for maritime
          installations, not NEK EN 50110-1.
        </p>
      </div>

      <ul className="relative mt-10 space-y-8 border-l border-white/10 pl-6">
        {navalSteps.map((st, idx) => (
          <li
            key={st.title}
            className={`relative ${tabActive ? styles.timelineStep : "opacity-100"}`}
            style={tabActive ? { animationDelay: `${idx * 150}ms` } : undefined}
          >
            <span
              className="absolute -left-[29px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#C9A84C]"
              aria-hidden
            />
            <div className="flex gap-3">
              <span className="shrink-0">{st.icon}</span>
              <div>
                <p className="text-[15px] font-semibold text-white">{st.title}</p>
                <p className="mt-2 text-[13px] leading-[1.7] text-white/65">{st.body}</p>
                {"source" in st && st.source ? (
                  <p className="mt-2 text-[11px] italic text-white/40">{st.source}</p>
                ) : null}
                {"link" in st && st.link ? (
                  <p className="mt-2">
                    <ExternalAnchor href={st.link.href}>{st.link.label}</ExternalAnchor>
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div
        className="mt-12 rounded-[14px] border border-[#C9A84C]/50 bg-white/[0.04] p-5 md:p-8"
      >
        <h3 className="text-lg font-bold text-white">Additional Authorizations for Naval and Offshore Work</h3>
        <p className="mt-2 text-[12px] font-semibold uppercase tracking-wide text-[#C9A84C]">
          Required in addition to DSB approval
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <div className={styles.floatSlow}>
              <IconShip className="text-[#C9A84C]" />
            </div>
            <p className="mt-4 text-sm font-semibold text-white">STCW Certification</p>
            <p className="mt-2 text-[13px] leading-[1.7] text-white/65">
              For work on internationally trading vessels, STCW (Standards of Training, Certification and Watchkeeping)
              certification may be required depending on the role. Verify with the shipowner and NMA which STCW
              certificates apply to the specific position.
            </p>
            <p className="mt-3">
              <ExternalAnchor href="https://www.sdir.no/en/seafarers/certificates/">NMA STCW information</ExternalAnchor>
            </p>
          </div>
          <div>
            <div className={styles.floatSlowDelay1}>
              <IconLifeBuoy className="text-[#C9A84C]" />
            </div>
            <p className="mt-4 text-sm font-semibold text-white">Offshore Safety Courses</p>
            <p className="mt-2 text-[13px] leading-[1.7] text-white/65">
              For work on offshore installations (petroleum facilities on the Norwegian continental shelf), additional
              safety certifications are required, including Basic Offshore Safety Induction and Emergency Training (BOSIET)
              and relevant Norwegian Petroleum Safety Authority (Ptil) compliance. These requirements are separate from
              DSB approval.
            </p>
            <p className="mt-3">
              <ExternalAnchor href="https://www.ptil.no/en/">Petroleum Safety Authority Norway</ExternalAnchor>
            </p>
          </div>
          <div>
            <div className={styles.floatSlowDelay2}>
              <IconRadio className="text-[#C9A84C]" />
            </div>
            <p className="mt-4 text-sm font-semibold text-white">Class Society Requirements</p>
            <p className="mt-2 text-[13px] leading-[1.7] text-white/65">
              For classified vessels, the relevant classification society (such as DNV) may impose additional electrical
              qualification or inspection requirements beyond DSB and NMA regulations. Verify classification requirements
              with the vessel owner before mobilizing personnel.
            </p>
            <p className="mt-3">
              <ExternalAnchor href="https://www.dnv.com/maritime/">DNV Maritime</ExternalAnchor>
            </p>
          </div>
        </div>
      </div>

      <Link
        href="/request"
        className="mt-10 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-[#C9A84C] px-6 py-3 text-center text-[13px] font-semibold text-[#0f1923] transition-opacity hover:opacity-95"
      >
        Find DSB-Approved Electricians for Maritime Projects
      </Link>
    </div>
  );
}

const TABS: { label: string; icon: ReactNode }[] = [
  { label: "DSB Approval", icon: <IconShieldCheck className="text-current" /> },
  { label: "Documents", icon: <IconFileText className="text-current" /> },
  { label: "Timeline", icon: <IconClock className="text-current" /> },
  { label: "FSE Regulation", icon: <IconZap className="text-current" /> },
  { label: "Datacenter", icon: <IconServer className="text-current" /> },
  { label: "Naval", icon: <IconAnchor className="text-current" /> },
];

export default function DsbCompleteGuide() {
  const [activeTab, setActiveTab] = useState(0);
  const panelId = useId();

  return (
    <section
      className={`${styles.respectMotion} border-t border-white/[0.06] py-10 md:py-14`}
      style={{ backgroundColor: NAVY }}
      aria-label="DSB complete guide in English"
    >
      <div className="mx-auto w-full max-w-[900px] px-6 md:px-0">
        <LegalDisclaimer />

        <div className="md:flex md:justify-center">
          <div
            className="-mx-1 flex gap-2 overflow-x-auto pb-2 md:mx-0 md:flex-wrap md:justify-center md:overflow-visible"
            role="tablist"
            aria-label="Guide sections"
          >
            {TABS.map((tab, i) => {
              const selected = activeTab === i;
              return (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`${panelId}-${i}`}
                  id={`${panelId}-tab-${i}`}
                  onClick={() => setActiveTab(i)}
                  className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-5 py-2 text-[13px] font-medium transition-colors duration-200 ${
                    selected
                      ? "bg-[#C9A84C] font-semibold text-[#0f1923]"
                      : "bg-white/[0.06] text-white/60"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 md:mt-10">
          {TABS.map((_, i) => (
            <div
              key={i}
              role="tabpanel"
              id={`${panelId}-${i}`}
              aria-labelledby={`${panelId}-tab-${i}`}
              hidden={activeTab !== i}
              className={activeTab === i ? styles.tabPanelEnter : undefined}
            >
              {activeTab === i ? (
                <div>
                  {i === 0 ? <TabApproval tabActive /> : null}
                  {i === 1 ? <TabDocuments /> : null}
                  {i === 2 ? <TabTimeline tabActive /> : null}
                  {i === 3 ? <TabFse tabActive /> : null}
                  {i === 4 ? <TabDatacenter /> : null}
                  {i === 5 ? <TabNaval tabActive /> : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
