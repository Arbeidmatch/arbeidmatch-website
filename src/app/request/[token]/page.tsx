"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type TokenData = { company: string; email: string; job_summary: string; org_number?: string };
type CompanyResult = { name: string; orgNumber: string };
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type RequestForm = {
  full_name: string;
  phonePrefix: "+47" | "+46" | "+45";
  phoneNumber: string;
  hiringType: string;
  category: string;
  position: string;
  positionOther: string;
  numberOfPositions: string;
  qualification: string;
  certifications: string[];
  certificationsOther: string;
  experience: string;
  norwegianLevel: string;
  englishLevel: string;
  driverLicense: string;
  driverLicenseOther: string;
  dNumber: string;
  dNumberOther: string;
  requirements: string;
  contractType: string;
  salaryPeriod: "Per hour" | "Per month";
  salaryMode: "Fixed amount" | "Range";
  salaryAmount: string;
  salaryFrom: string;
  salaryTo: string;
  hoursUnit: "Per day" | "Per week" | "Per month";
  hoursAmount: string;
  overtime: string;
  maxOvertimeHours: string;
  hasRotation: string;
  rotationWeeksOn: string;
  rotationWeeksOff: string;
  internationalTravel: string;
  localTravel: string;
  localTravelOther: string;
  accommodation: string;
  accommodationCost: string;
  accommodationOther: string;
  equipment: string;
  equipmentOther: string;
  tools: string;
  toolsOther: string;
  city: string;
  startDate: string;
  startDateOther: string;
  howDidYouHear: string;
  socialMediaPlatform: string;
  socialMediaOther: string;
  howDidYouHearOther: string;
  referralCompanyName: string;
  referralOrgNumber: string;
  referralEmail: string;
  subscribe: string;
  notes: string;
};

const inputClass =
  "w-full rounded-md border border-border px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold";
const radioClass =
  "flex items-center gap-2 rounded-md border border-border p-3 text-sm text-navy w-full cursor-pointer";
const groupBaseClass = "space-y-2 rounded-md";
const blockBtnClass = "w-full rounded-md border border-border px-3 py-2 text-left text-sm font-semibold text-navy";
const titleClass = "text-lg font-bold text-[#0D1B2A]";
const labelClass = "mb-1 block text-sm font-medium text-navy";
const alwaysOpenSections = {
  roleOptions: true,
  norwegian: true,
  english: true,
  driver: true,
  dnumber: true,
  overtime: true,
  rotation: true,
  intlTravel: true,
  localTravel: true,
  accommodation: true,
  equipment: true,
  tools: true,
  startDate: true,
  hear: true,
} as const;
const howDidYouHearOptions = [
  "Google search",
  "Referral from another company",
  "Referral from a friend",
  "Social media",
  "Other",
] as const;

const rolesByCategory: Record<string, string[]> = {
  Construction: ["Carpenter", "Bricklayer", "Tile layer", "Painter", "Plasterer", "Roofer", "Concrete worker", "Steel fixer", "Scaffolder", "Insulation worker", "Floor layer", "Window installer", "Demolition worker"],
  "Civil Engineering (Anlegg)": ["Excavator operator", "Pipeline layer", "Road worker", "Asphalt worker", "Crane operator", "Survey technician"],
  "Electrical & Mechanical": ["Electrician", "Plumber", "HVAC technician", "Mechanic", "Refrigeration technician"],
  "Industry & Logistics": ["Forklift operator", "Warehouse worker", "Machine operator", "Welder", "CNC operator", "Driver"],
  "Cleaning & Facility": ["Cleaner", "Janitor", "Facility technician", "Window cleaner"],
  Offshore: [
    "Roughneck", "Roustabout", "Derrickman", "Driller", "Tool pusher",
    "Offshore electrician", "Offshore mechanic", "Crane operator (offshore)",
    "Scaffolder (offshore)", "Safety officer", "Medic (offshore)",
    "Catering worker (offshore)", "Painter (offshore)",
  ],
  "Onshore / Oil & Gas": [
    "Process operator", "Instrument technician", "Pipeline welder",
    "Construction supervisor", "HSE coordinator", "Tank cleaner",
    "Industrial painter", "Maintenance mechanic",
  ],
  "Transport & Driving": [
    "Truck driver (CE)", "Truck driver (C)", "Bus driver (D)",
    "Tanker driver (ADR)", "Refrigerated transport driver",
    "Forklift operator", "Logistics coordinator", "Warehouse worker",
  ],
  Automotive: [
    "Auto mechanic (light vehicles)", "Auto mechanic (heavy vehicles)",
    "Body repair technician (tinsmith)", "Car painter",
    "Tire technician", "Car electrician", "Diagnostics technician",
    "Service advisor",
  ],
};

const certsByRole: Record<string, string[]> = {
  Carpenter: ["Fagbrev tømrer", "Arbeid i høyden sertifikat", "Stillassertifikat (bruker)", "Fallsikringskurs", "Truck/løfteutstyr", "Other"],
  Bricklayer: ["Fagbrev murer", "Arbeid i høyden", "Stillassertifikat bruker", "Other"],
  "Tile layer": ["Fagbrev flislegger", "Arbeid i høyden", "Other"],
  Painter: ["Fagbrev maler", "Arbeid i høyden", "Farlig gods/kjemikalier", "Other"],
  Plasterer: ["Fagbrev", "Arbeid i høyden", "Other"],
  Roofer: ["Fagbrev taktekkjer", "Arbeid i høyden", "Fallsikring", "Other"],
  "Concrete worker": ["Fagbrev betongfaget", "Arbeid i høyden", "Stillassertifikat", "Other"],
  "Steel fixer": ["Fagbrev", "Arbeid i høyden", "Other"],
  Scaffolder: ["Stillassertifikat nivå 3", "Stillassertifikat nivå 2", "Stillassertifikat nivå 1", "Arbeid i høyden", "Other"],
  "Insulation worker": ["Fagbrev", "Arbeid i høyden", "Asbestsertifikat", "Other"],
  "Floor layer": ["Fagbrev gullegger", "Other"],
  "Window installer": ["Fagbrev", "Arbeid i høyden", "Other"],
  "Demolition worker": ["Rivearbeider sertifikat", "Asbestkartlegging", "Arbeid i høyden", "Other"],
  "Excavator operator": ["Maskinførerbevis", "Anleggsmaskinførerbevis", "Other"],
  "Pipeline layer": ["Fagbrev", "VA-kompetanse", "Other"],
  "Road worker": ["Veg- og anleggsfaget", "HMS anlegg", "Other"],
  "Asphalt worker": ["Asfaltfaget fagbrev", "Other"],
  "Crane operator": ["G4 (mobilkran)", "G8 (tårnkran)", "G11 (traverskran)", "G1", "G2", "G3", "Løftesertifikat", "Other"],
  "Survey technician": ["Landmålerkompetanse", "Other"],
  "Forklift operator": ["T4", "T1", "T2", "T3", "T5", "T6", "T7", "T8", "Other"],
  "Warehouse worker": ["Truck T1/T2", "HMS lager", "Other"],
  "Machine operator": ["Maskinførerbevis", "Other"],
  Welder: ["ISO 9606-1 (stål)", "ISO 9606-2 (aluminium)", "NS-EN ISO 15614", "Offshore sveisesertifikat", "Other"],
  "CNC operator": ["CNC kompetansebevis", "Other"],
  Driver: ["Førerkort CE", "Førerkort C", "Førerkort C1E", "ADR sertifikat", "Yrkessjåførkompetansebevis", "Other"],
  Cleaner: ["HMS renhold", "Kjemikaliekurs", "Other"],
  Janitor: ["Vaktmesterkompetanse", "Driftspersonellsertifikat", "Other"],
  "Facility technician": ["Driftstekniker kompetanse", "Other"],
  "Window cleaner": ["Arbeid i høyden", "Repelaufteknikk", "Other"],
  Electrician: ["Fagbrev elektriker", "DSB autorisasjon lavspenning", "DSB autorisasjon høyspenning", "ATEX/EX sertifikat", "Other"],
  Plumber: ["Fagbrev rørlegger", "Våtromssertifikat", "Other"],
  "HVAC technician": ["Ventilasjonsmontør fagbrev", "Other"],
  Mechanic: ["Fagbrev industrimekanikar", "Fagbrev bilfaget", "Other"],
  "Refrigeration technician": ["Kuldesertifikat klasse I", "Kuldesertifikat klasse II", "F-gass sertifikat", "Other"],
};

const initialData: RequestForm = {
  full_name: "",
  phonePrefix: "+47",
  phoneNumber: "",
  hiringType: "",
  category: "",
  position: "",
  positionOther: "",
  numberOfPositions: "",
  qualification: "",
  certifications: [],
  certificationsOther: "",
  experience: "",
  norwegianLevel: "",
  englishLevel: "",
  driverLicense: "",
  driverLicenseOther: "",
  dNumber: "",
  dNumberOther: "",
  requirements: "",
  contractType: "",
  salaryPeriod: "Per hour",
  salaryMode: "Fixed amount",
  salaryAmount: "",
  salaryFrom: "",
  salaryTo: "",
  hoursUnit: "Per week",
  hoursAmount: "",
  overtime: "",
  maxOvertimeHours: "",
  hasRotation: "",
  rotationWeeksOn: "",
  rotationWeeksOff: "",
  internationalTravel: "",
  localTravel: "",
  localTravelOther: "",
  accommodation: "",
  accommodationCost: "",
  accommodationOther: "",
  equipment: "",
  equipmentOther: "",
  tools: "",
  toolsOther: "",
  city: "",
  startDate: "",
  startDateOther: "",
  howDidYouHear: "",
  socialMediaPlatform: "Facebook",
  socialMediaOther: "",
  howDidYouHearOther: "",
  referralCompanyName: "",
  referralOrgNumber: "",
  referralEmail: "",
  subscribe: "",
  notes: "",
};

export default function DetailedRequestPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [tokenStatus, setTokenStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [visible, setVisible] = useState(true);
  const [stepError, setStepError] = useState("");
  const [invalidField, setInvalidField] = useState("");
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [formData, setFormData] = useState<RequestForm>(initialData);
  const [expanded] = useState<Record<string, boolean>>(alwaysOpenSections as Record<string, boolean>);
  const [referralResults, setReferralResults] = useState<CompanyResult[]>([]);
  const [isSearchingReferral, setIsSearchingReferral] = useState(false);
  const [hasSearchedReferral, setHasSearchedReferral] = useState(false);
  const [confirmNoSubscribe, setConfirmNoSubscribe] = useState(false);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const stepCount = 9;
  const progress = ((step + 1) / stepCount) * 100;
  const roles = useMemo(
    () => (formData.category ? [...(rolesByCategory[formData.category] ?? []), "Other"] : []),
    [formData.category],
  );
  const roleKey = formData.position === "Other" ? formData.positionOther : formData.position;
  const certOptions = useMemo(() => certsByRole[roleKey] ?? ["Other"], [roleKey]);

  const setRef = (name: string, el: HTMLElement | null) => {
    fieldRefs.current[name] = el;
  };
  const updateField = (key: keyof RequestForm, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));
  const toggleExpand = (_key: string) => {
    // Question groups must stay open at all times.
  };
  const toggleCert = (value: string) =>
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.includes(value)
        ? prev.certifications.filter((item) => item !== value)
        : [...prev.certifications, value],
    }));
  const groupErrorClass = (name: string) =>
    `${groupBaseClass} ${invalidField === name ? "border border-red-500 ring-1 ring-red-500 p-2" : ""}`;

  const focusField = (name: string) => {
    const el = fieldRefs.current[name];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => el.focus(), 60);
  };

  useEffect(() => {
    const verify = async () => {
      try {
        const verifyRes = await fetch(`/api/verify-token?token=${token}`).then((r) => r.json());
        if (!verifyRes.valid) return setTokenStatus("invalid");
        const dataRes = await fetch(`/api/token-data/${token}`).then((r) => r.json());
        if (!dataRes.success || !dataRes.data) return setTokenStatus("invalid");
        setTokenData(dataRes.data);
        setTokenStatus("valid");
      } catch {
        setTokenStatus("invalid");
      }
    };
    if (token) void verify();
    else setTokenStatus("invalid");
  }, [token]);

  useEffect(() => {
    if (formData.howDidYouHear !== "Referral from another company" || formData.referralCompanyName.trim().length < 2) {
      setReferralResults([]);
      setHasSearchedReferral(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearchingReferral(true);
        const res = await fetch(
          `https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(formData.referralCompanyName)}&size=10`,
        );
        const data = (await res.json()) as {
          _embedded?: { enheter?: Array<{ navn?: string; organisasjonsnummer?: string }> };
        };
        setReferralResults(
          (data._embedded?.enheter ?? []).map((item) => ({
            name: item.navn ?? "",
            orgNumber: item.organisasjonsnummer ?? "",
          })),
        );
      } catch {
        setReferralResults([]);
      } finally {
        setHasSearchedReferral(true);
        setIsSearchingReferral(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.howDidYouHear, formData.referralCompanyName]);

  const validateStep = (s: Step): string | null => {
    const phoneDigits = formData.phoneNumber.replace(/\D/g, "");
    if (s === 0) {
      if (!formData.full_name.trim()) return "full_name";
      if (!formData.phonePrefix || phoneDigits.length < 8) return "phone";
    }
    if (s === 1 && !formData.hiringType) return "hiringType";
    if (s === 2) {
      if (!formData.category) return "category";
      if (!formData.position) return "position";
      if (formData.position === "Other" && !formData.positionOther.trim()) return "positionOther";
      if (!formData.numberOfPositions) return "numberOfPositions";
    }
    if (s === 3) {
      if (!formData.qualification) return "qualification";
      if (formData.qualification !== "No experience needed" && !formData.experience) return "experience";
      if (
        formData.qualification !== "No experience needed" &&
        formData.certifications.includes("Other") &&
        !formData.certificationsOther.trim()
      ) {
        return "certificationsOther";
      }
    }
    if (s === 4) {
      if (!formData.norwegianLevel) return "norwegianLevel";
      if (!formData.englishLevel) return "englishLevel";
    }
    if (s === 5) {
      if (!formData.driverLicense) return "driverLicense";
      if (formData.driverLicense === "Other" && !formData.driverLicenseOther.trim()) return "driverLicenseOther";
      if (!formData.dNumber) return "dNumber";
    }
    if (s === 6) {
      if (!formData.contractType) return "contractType";
      if (formData.salaryMode === "Fixed amount" && !formData.salaryAmount) return "salaryAmount";
      if (formData.salaryMode === "Range" && !formData.salaryFrom) return "salaryFrom";
      if (formData.salaryMode === "Range" && !formData.salaryTo) return "salaryTo";
      if (!formData.hoursAmount) return "hoursAmount";
      if (!formData.overtime) return "overtime";
      if ((formData.overtime === "Yes" || formData.overtime === "Occasionally") && !formData.maxOvertimeHours)
        return "maxOvertimeHours";
      if (!formData.hasRotation) return "hasRotation";
      if (formData.hasRotation === "Yes" && !formData.rotationWeeksOn) return "rotationWeeksOn";
      if (formData.hasRotation === "Yes" && !formData.rotationWeeksOff) return "rotationWeeksOff";
    }
    if (s === 7) {
      if (!formData.internationalTravel) return "internationalTravel";
      if (!formData.localTravel) return "localTravel";
      if (formData.localTravel === "Other" && !formData.localTravelOther.trim()) return "localTravelOther";
      if (!formData.accommodation) return "accommodation";
      if (formData.accommodation === "We help find it" && !formData.accommodationCost) return "accommodationCost";
      if (formData.accommodation === "Other" && !formData.accommodationOther.trim()) return "accommodationOther";
      if (!formData.equipment) return "equipment";
      if (formData.equipment === "Other" && !formData.equipmentOther.trim()) return "equipmentOther";
      if (!formData.tools) return "tools";
      if (formData.tools === "Other" && !formData.toolsOther.trim()) return "toolsOther";
    }
    if (s === 8) {
      if (!formData.city.trim()) return "city";
      if (!formData.startDate) return "startDate";
      if (formData.startDate === "Other" && !formData.startDateOther) return "startDateOther";
      if (!formData.howDidYouHear) return "howDidYouHear";
      if (
        formData.howDidYouHear === "Social media" &&
        formData.socialMediaPlatform === "Other" &&
        !formData.socialMediaOther.trim()
      ) {
        return "socialMediaOther";
      }
      if (formData.howDidYouHear === "Other" && !formData.howDidYouHearOther.trim()) return "howDidYouHearOther";
      if (formData.howDidYouHear === "Referral from another company" && !formData.referralCompanyName.trim())
        return "referralCompanyName";
      if (!formData.subscribe) return "subscribe";
    }
    return null;
  };

  const goStep = (target: Step) => {
    setVisible(false);
    setTimeout(() => {
      setStep(target);
      setVisible(true);
    }, 300);
  };

  const next = () => {
    const invalid = validateStep(step);
    if (invalid) {
      setInvalidField(invalid);
      setStepError("Please complete all required fields in this section.");
      focusField(invalid);
      return;
    }
    setInvalidField("");
    setStepError("");
    window.scrollTo({ top: 0, behavior: "auto" });
    if (step < 8) goStep((step + 1) as Step);
  };
  const back = () => {
    setStepError("");
    window.scrollTo({ top: 0, behavior: "auto" });
    if (step > 0) goStep((step - 1) as Step);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const invalid = validateStep(8);
    if (invalid) {
      setInvalidField(invalid);
      setStepError("Please complete all required fields in this section.");
      focusField(invalid);
      return;
    }

    setSubmitError("");
    setSubmitStatus("idle");
    setIsSubmitting(true);

    const salary =
      formData.salaryMode === "Fixed amount"
        ? `${formData.salaryPeriod}: ${formData.salaryAmount} NOK`
        : `${formData.salaryPeriod}: ${formData.salaryFrom}-${formData.salaryTo} NOK`;

    const payload = {
      ...formData,
      token,
      phone: `${formData.phonePrefix} ${formData.phoneNumber.replace(/\D/g, "")}`,
      company: tokenData?.company ?? "",
      orgNumber: tokenData?.org_number ?? "",
      email: tokenData?.email ?? "",
      job_summary: tokenData?.job_summary ?? "",
      certifications: formData.qualification === "No experience needed" ? "" : formData.certifications.join(", "),
      salary,
      hoursAmount: formData.hoursAmount,
    };

    try {
      const emailRes = await fetch("/api/send-request-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!emailRes.ok) throw new Error("send-request-email");

      try {
        await fetch("/api/save-employer-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error("save-employer-request failed", error);
      }

      try {
        await fetch(`/api/verify-token?token=${token}`, { method: "DELETE" });
      } catch (error) {
        console.error("verify-token delete failed", error);
      }

      setSubmitStatus("success");
    } catch {
      setSubmitStatus("error");
      setSubmitError("Failed to send email notifications.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const invalid = (name: string) =>
    invalidField === name ? "border-red-500 ring-1 ring-red-500" : "";

  if (tokenStatus === "checking") {
    return <section className="bg-surface py-8"><div className="mx-auto max-w-2xl px-4 text-center">Verifying your access...</div></section>;
  }
  if (tokenStatus === "invalid") {
    return <section className="bg-surface py-8"><div className="mx-auto max-w-2xl px-4 text-center"><h1 className="text-2xl font-bold text-navy">Link expired or invalid</h1><p className="mt-2 text-sm text-text-secondary">Please start a new request.</p></div></section>;
  }
  if (submitStatus === "success") {
    const selectedPosition = formData.position === "Other" ? formData.positionOther : formData.position;
    const selectedStartDate = formData.startDate === "Other" ? formData.startDateOther : formData.startDate;
    return (
      <section className="bg-surface py-10">
        <div className="mx-auto w-full max-w-2xl px-3">
          <div className="rounded-xl bg-white p-5 text-center shadow-[0_10px_30px_rgba(13,27,42,0.08)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold text-3xl font-bold text-white">✓</div>
            <h1 className="mt-4 text-3xl font-bold text-navy">Request submitted successfully!</h1>
            <p className="mt-2 text-sm text-text-secondary">
              Thank you, {formData.full_name || "there"}. We will review your request and be in touch with you soon.
            </p>
            <div className="mx-auto mt-4 max-w-lg rounded-xl border-l-4 border-navy bg-navy/[0.03] p-4 text-left text-sm text-navy">
              <p><strong>Position:</strong> {selectedPosition || "-"}</p>
              <p><strong>Number of candidates:</strong> {formData.numberOfPositions || "-"}</p>
              <p><strong>Location:</strong> {formData.city || "-"}</p>
              <p><strong>Start date:</strong> {selectedStartDate || "-"}</p>
            </div>
            <button type="button" onClick={() => router.push("/")} className="mt-5 rounded-md bg-[#C9A84C] px-6 py-2.5 text-sm font-medium text-white hover:bg-gold-hover">Back to home</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface py-6">
      <div className="mx-auto w-full max-w-2xl px-3">
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Candidate Request - Details</h1>
        <p className="mt-1 text-sm text-text-secondary">Complete all steps to submit your candidate request.</p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
          <div className="h-full bg-[#C9A84C] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div className={`mx-auto w-full max-w-2xl rounded-xl bg-white p-4 shadow-[0_10px_30px_rgba(13,27,42,0.08)] transition-opacity duration-300 md:p-5 ${visible ? "opacity-100" : "opacity-0"}`}>
            {step === 0 && (
              <div className="space-y-3">
                <h2 className={titleClass}>Who should we contact?</h2>
                <label className={labelClass}>First name last name</label>
                <input className={`${inputClass} ${invalid("full_name")}`} placeholder="First name last name*" value={formData.full_name} onChange={(e) => updateField("full_name", e.target.value)} ref={(e) => setRef("full_name", e)} />
                <label className={labelClass}>Phone</label>
                <div className="grid grid-cols-[130px_1fr] gap-2">
                  <select
                    className={`${inputClass} ${invalid("phone")}`}
                    value={formData.phonePrefix}
                    onChange={(e) => updateField("phonePrefix", e.target.value as "+47" | "+46" | "+45")}
                  >
                    <option value="+47">+47 (Norway)</option>
                    <option value="+46">+46 (Sweden)</option>
                    <option value="+45">+45 (Denmark)</option>
                  </select>
                  <input
                    className={`${inputClass} ${invalid("phone")}`}
                    placeholder="98765432"
                    value={formData.phoneNumber}
                    onChange={(e) => updateField("phoneNumber", e.target.value)}
                    ref={(e) => setRef("phone", e)}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <h2 className={titleClass}>Type of engagement</h2>
                <div className={`flex flex-col gap-2 rounded-md ${invalidField === "hiringType" ? "border border-red-500 ring-1 ring-red-500 p-2" : ""}`}>
                  {[
                    "Sourcing — We find the right candidates from our network",
                    "Recruitment — Full recruitment process",
                    "Staffing — Innleie/bemanning",
                  ].map((v, i) => (
                    <label key={v} className={radioClass}>
                      <input type="radio" className="shrink-0" checked={formData.hiringType === v} onChange={() => updateField("hiringType", v)} ref={(e) => { if (i === 0) setRef("hiringType", e); }} />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <h2 className={titleClass}>Sector & Role</h2>
                <label className={labelClass}>Category</label>
                <select className={`${inputClass} ${invalid("category")}`} value={formData.category} onChange={(e) => { updateField("category", e.target.value); updateField("position", ""); updateField("positionOther", ""); }} ref={(e) => setRef("category", e)}>
                  <option value="">Select category*</option>
                  {Object.keys(rolesByCategory).map((x) => <option key={x}>{x}</option>)}
                </select>
                {formData.category && (
                  <>
                    <label className={labelClass}>Position</label>
                    <button
                      type="button"
                      className={`${blockBtnClass} ${invalid("position")}`}
                      onClick={() => toggleExpand("roleOptions")}
                    >
                      {formData.position || "Select role*"} {expanded.roleOptions ? "▲" : "▼"}
                    </button>
                    {expanded.roleOptions && (
                      <div className="space-y-2">
                        {roles.map((x) => (
                          <label key={x} className={radioClass}>
                            <input
                              type="radio"
                              className="shrink-0"
                              checked={formData.position === x}
                              onChange={() => {
                                updateField("position", x);
                                if (x !== "Other") updateField("positionOther", "");
                              }}
                              ref={(e) => setRef("position", e)}
                            />
                            {x}
                          </label>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {formData.position === "Other" && (
                  <>
                    <label className={labelClass}>Specify role</label>
                    <input className={`${inputClass} ${invalid("positionOther")}`} placeholder="Specify role*" value={formData.positionOther} onChange={(e) => updateField("positionOther", e.target.value)} ref={(e) => setRef("positionOther", e)} />
                  </>
                )}
                <label className={labelClass}>Number of candidates</label>
                <input type="number" className={`${inputClass} ${invalid("numberOfPositions")}`} placeholder="Number of candidates*" value={formData.numberOfPositions} onChange={(e) => updateField("numberOfPositions", e.target.value)} ref={(e) => setRef("numberOfPositions", e)} />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <h2 className={titleClass}>Qualification</h2>
                <div className={`${groupBaseClass} ${invalidField === "qualification" ? "border border-red-500 ring-1 ring-red-500 p-2" : ""}`}>
                  {["No experience needed", "Some experience", "Certified", "Fully certified"].map((v, i) => (
                    <div key={v} className="space-y-2">
                      <label className={radioClass}>
                        <input type="radio" className="shrink-0" checked={formData.qualification === v} onChange={() => updateField("qualification", v)} ref={(e) => { if (i === 0) setRef("qualification", e); }} />
                        {v}
                      </label>
                      {formData.qualification === v && v !== "No experience needed" && (
                        <div className="space-y-2 rounded-md border border-border/60 bg-surface p-3">
                          <p className="text-sm font-semibold text-navy">Required certifications</p>
                          <div className="space-y-2">
                            {certOptions.map((cert) => (
                              <label key={cert} className={radioClass}>
                                <input type="checkbox" className="shrink-0" checked={formData.certifications.includes(cert)} onChange={() => toggleCert(cert)} />
                                {cert}
                                {cert === "Other" && formData.certifications.includes("Other") && (
                                  <input className={`${inputClass} ${invalid("certificationsOther")} ml-2 max-w-[220px]`} placeholder="Specify other*" value={formData.certificationsOther} onChange={(e) => updateField("certificationsOther", e.target.value)} ref={(e) => setRef("certificationsOther", e)} />
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {formData.qualification !== "No experience needed" && (
                  <>
                    <label className={labelClass}>Minimum years of experience</label>
                    <input type="number" className={`${inputClass} ${invalid("experience")}`} placeholder="Minimum years of experience*" value={formData.experience} onChange={(e) => updateField("experience", e.target.value)} ref={(e) => setRef("experience", e)} />
                  </>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <h2 className={titleClass}>Language requirements</h2>
                <button type="button" className="w-full rounded-md border border-border px-3 py-2 text-left text-sm font-semibold text-navy" onClick={() => toggleExpand("norwegian")}>Norwegian {expanded.norwegian ? "▲" : "▼"}</button>
                {expanded.norwegian && <div className={groupErrorClass("norwegianLevel")}>{["Not required", "Basic", "Working level", "Fluent"].map((v, i) => <label key={v} className={radioClass}><input type="radio" className="shrink-0" checked={formData.norwegianLevel === v} onChange={() => updateField("norwegianLevel", v)} ref={(e) => { if (i === 0) setRef("norwegianLevel", e); }} />{v}</label>)}</div>}
                <button type="button" className="w-full rounded-md border border-border px-3 py-2 text-left text-sm font-semibold text-navy" onClick={() => toggleExpand("english")}>English {expanded.english ? "▲" : "▼"}</button>
                {expanded.english && <div className={groupErrorClass("englishLevel")}>{["Not required", "Basic", "Working level", "Fluent"].map((v, i) => <label key={v} className={radioClass}><input type="radio" className="shrink-0" checked={formData.englishLevel === v} onChange={() => updateField("englishLevel", v)} ref={(e) => { if (i === 0) setRef("englishLevel", e); }} />{v}</label>)}</div>}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-3">
                <h2 className={titleClass}>Requirements</h2>
                <button type="button" className="w-full rounded-md border border-border px-3 py-2 text-left text-sm font-semibold text-navy" onClick={() => toggleExpand("driver")}>Driver's license {expanded.driver ? "▲" : "▼"}</button>
                {expanded.driver && <div className={groupErrorClass("driverLicense")}>{["None", "AM", "A1", "A2", "A", "B", "B+E", "C1", "C1+E", "C", "C+E", "D1", "D1+E", "D", "D+E", "T", "Other"].map((v, i) => <label key={v} className={radioClass}><input type="radio" className="shrink-0" checked={formData.driverLicense === v} onChange={() => updateField("driverLicense", v)} ref={(e) => { if (i === 0) setRef("driverLicense", e); }} />{v}{v === "Other" && formData.driverLicense === "Other" && <input className={`${inputClass} ${invalid("driverLicenseOther")} ml-2 max-w-[220px]`} placeholder="Specify*" value={formData.driverLicenseOther} onChange={(e) => updateField("driverLicenseOther", e.target.value)} ref={(e) => setRef("driverLicenseOther", e)} />}</label>)}</div>}
                <button type="button" className="w-full rounded-md border border-border px-3 py-2 text-left text-sm font-semibold text-navy" onClick={() => toggleExpand("dnumber")}>D-number {expanded.dnumber ? "▲" : "▼"}</button>
                {expanded.dnumber && <div className={groupErrorClass("dNumber")}>{["Already has a D-number", "We can handle the D-number procedure for the candidate"].map((v, i) => <label key={v} className={radioClass}><input type="radio" className="shrink-0" checked={formData.dNumber === v} onChange={() => updateField("dNumber", v)} ref={(e) => { if (i === 0) setRef("dNumber", e); }} />{v}</label>)}</div>}
                <label className={labelClass}>Deal breakers</label>
                <textarea rows={3} className={inputClass} placeholder="Deal breakers (optional)" value={formData.requirements} onChange={(e) => updateField("requirements", e.target.value)} />
              </div>
            )}

            {step === 6 && (
              <div className="space-y-3">
                <h2 className={titleClass}>Contract & Pay</h2>
                <label className={labelClass}>Contract type</label>
                <select className={`${inputClass} ${invalid("contractType")}`} value={formData.contractType} onChange={(e) => updateField("contractType", e.target.value)} ref={(e) => setRef("contractType", e)}>
                  <option value="">Contract type*</option>
                  <option>Fast ansettelse - direkte hos klient</option>
                  <option>Fast ansettelse - via bemanningsbyrå</option>
                  <option>Midlertidig ansettelse - direkte hos klient</option>
                  <option>Midlertidig ansettelse - via bemanningsbyrå</option>
                  <option>Innleie fra bemanningsbyrå</option>
                  <option>Selvstendig oppdragstaker</option>
                  <option>Sesongarbeid</option>
                </select>

                <p className="text-sm font-semibold text-navy">Working Hours</p>
                <div className="flex flex-wrap gap-2">
                  {(["Per day", "Per week", "Per month"] as const).map((unit) => (
                    <button key={unit} type="button" className={`rounded-md border px-3 py-2 text-sm ${formData.hoursUnit === unit ? "border-gold bg-gold/10 text-navy" : "border-border text-navy"}`} onClick={() => updateField("hoursUnit", unit)}>{unit}</button>
                  ))}
                </div>
                <label className={labelClass}>Hours amount</label>
                <input className={`${inputClass} ${invalid("hoursAmount")}`} placeholder="Hours*" value={formData.hoursAmount} onChange={(e) => updateField("hoursAmount", e.target.value)} ref={(e) => setRef("hoursAmount", e)} />

                <p className="text-sm font-semibold text-navy">Salary</p>
                <div className={groupBaseClass}>
                  {(["Per hour", "Per month"] as const).map((v) => (
                    <label key={v} className={radioClass}>
                      <input type="radio" className="shrink-0" checked={formData.salaryPeriod === v} onChange={() => updateField("salaryPeriod", v)} />
                      {v}
                    </label>
                  ))}
                </div>
                <div className="space-y-2">
                  <label className={radioClass}><input type="radio" className="shrink-0" checked={formData.salaryMode === "Fixed amount"} onChange={() => updateField("salaryMode", "Fixed amount")} />Fixed amount</label>
                  <label className={radioClass}><input type="radio" className="shrink-0" checked={formData.salaryMode === "Range"} onChange={() => updateField("salaryMode", "Range")} />Range</label>
                </div>
                {formData.salaryMode === "Fixed amount" ? (
                  <div>
                    <label className={labelClass}>Amount (NOK)</label>
                    <input className={`${inputClass} ${invalid("salaryAmount")}`} placeholder="Amount*" value={formData.salaryAmount} onChange={(e) => updateField("salaryAmount", e.target.value)} ref={(e) => setRef("salaryAmount", e)} />
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>From (NOK)</label>
                      <input className={`${inputClass} ${invalid("salaryFrom")}`} placeholder="From*" value={formData.salaryFrom} onChange={(e) => updateField("salaryFrom", e.target.value)} ref={(e) => setRef("salaryFrom", e)} />
                    </div>
                    <div>
                      <label className={labelClass}>To (NOK)</label>
                      <input className={`${inputClass} ${invalid("salaryTo")}`} placeholder="To*" value={formData.salaryTo} onChange={(e) => updateField("salaryTo", e.target.value)} ref={(e) => setRef("salaryTo", e)} />
                    </div>
                  </div>
                )}

                <button type="button" className="w-full rounded-md border border-border px-3 py-2 text-left text-sm font-semibold text-navy" onClick={() => toggleExpand("overtime")}>Overtime {expanded.overtime ? "▲" : "▼"}</button>
                {expanded.overtime && <div className={groupErrorClass("overtime")}>{["Yes", "Occasionally", "No"].map((v, i) => <label key={v} className={radioClass}><input type="radio" className="shrink-0" checked={formData.overtime === v} onChange={() => updateField("overtime", v)} ref={(e) => { if (i === 0) setRef("overtime", e); }} />{v}{(v === "Yes" || v === "Occasionally") && formData.overtime === v && <span className="ml-2 inline-flex items-center gap-2"><span className="text-xs text-text-secondary">Max hours/week</span><input type="number" className={`${inputClass} ${invalid("maxOvertimeHours")} w-28`} placeholder="Max*" value={formData.maxOvertimeHours} onChange={(e) => updateField("maxOvertimeHours", e.target.value)} ref={(e) => setRef("maxOvertimeHours", e)} /></span>}</label>)}</div>}

                <button type="button" className="w-full rounded-md border border-border px-3 py-2 text-left text-sm font-semibold text-navy" onClick={() => toggleExpand("rotation")}>Rotation {expanded.rotation ? "▲" : "▼"}</button>
                {expanded.rotation && (
                  <div className={groupErrorClass("hasRotation")}>
                    {["Yes", "No"].map((v, i) => (
                      <label key={v} className={radioClass}>
                        <input type="radio" className="shrink-0" checked={formData.hasRotation === v} onChange={() => updateField("hasRotation", v)} ref={(e) => { if (i === 0) setRef("hasRotation", e); }} />
                        {v}
                        {v === "Yes" && formData.hasRotation === "Yes" && (
                          <span className="ml-2 inline-flex gap-2">
                            <select className={`${inputClass} ${invalid("rotationWeeksOn")} w-28`} value={formData.rotationWeeksOn} onChange={(e) => updateField("rotationWeeksOn", e.target.value)} ref={(e) => setRef("rotationWeeksOn", e)}>
                              <option value="">On*</option>
                              {["1 week", "2 weeks", "3 weeks", "4 weeks", "6 weeks", "8 weeks"].map((x) => <option key={x}>{x}</option>)}
                            </select>
                            <select className={`${inputClass} ${invalid("rotationWeeksOff")} w-28`} value={formData.rotationWeeksOff} onChange={(e) => updateField("rotationWeeksOff", e.target.value)} ref={(e) => setRef("rotationWeeksOff", e)}>
                              <option value="">Off*</option>
                              {["1 week", "2 weeks", "3 weeks", "4 weeks", "6 weeks", "8 weeks"].map((x) => <option key={x}>{x}</option>)}
                            </select>
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 7 && (
              <div className="space-y-3">
                <h2 className={titleClass}>Working conditions</h2>
                <button type="button" className="w-full rounded-md border border-border px-3 py-2 text-left text-sm font-semibold text-navy" onClick={() => toggleExpand("intlTravel")}>International travel {expanded.intlTravel ? "▲" : "▼"}</button>
                {expanded.intlTravel && <div className={groupErrorClass("internationalTravel")}>{["Covered by the company (flights, transport)", "Candidate's own responsibility"].map((v, i) => <label key={v} className={radioClass}><input type="radio" className="shrink-0" checked={formData.internationalTravel === v} onChange={() => updateField("internationalTravel", v)} ref={(e) => { if (i === 0) setRef("internationalTravel", e); }} />{v}</label>)}</div>}

                <button type="button" className="w-full rounded-md border border-border px-3 py-2 text-left text-sm font-semibold text-navy" onClick={() => toggleExpand("localTravel")}>Local travel {expanded.localTravel ? "▲" : "▼"}</button>
                {expanded.localTravel && <div className={groupErrorClass("localTravel")}>{["Company car", "Company card for public transport", "Own transport (reimbursed)", "Own transport (not reimbursed)", "Other"].map((v, i) => <label key={v} className={radioClass}><input type="radio" className="shrink-0" checked={formData.localTravel === v} onChange={() => updateField("localTravel", v)} ref={(e) => { if (i === 0) setRef("localTravel", e); }} />{v}{v === "Other" && formData.localTravel === "Other" && <input className={`${inputClass} ${invalid("localTravelOther")} ml-2 max-w-[220px]`} placeholder="Specify*" value={formData.localTravelOther} onChange={(e) => updateField("localTravelOther", e.target.value)} ref={(e) => setRef("localTravelOther", e)} />}</label>)}</div>}

                <button type="button" className="w-full rounded-md border border-border px-3 py-2 text-left text-sm font-semibold text-navy" onClick={() => toggleExpand("accommodation")}>Accommodation {expanded.accommodation ? "▲" : "▼"}</button>
                {expanded.accommodation && <div className={groupErrorClass("accommodation")}>{["Free accommodation provided", "Not included", "We help find it", "Other"].map((v, i) => <label key={v} className={radioClass}><input type="radio" className="shrink-0" checked={formData.accommodation === v} onChange={() => updateField("accommodation", v)} ref={(e) => { if (i === 0) setRef("accommodation", e); }} />{v}{v === "We help find it" && formData.accommodation === "We help find it" && <input className={`${inputClass} ${invalid("accommodationCost")} ml-2 max-w-[220px]`} placeholder="Accommodation cost (NOK/month)*" value={formData.accommodationCost} onChange={(e) => updateField("accommodationCost", e.target.value)} ref={(e) => setRef("accommodationCost", e)} />}{v === "Other" && formData.accommodation === "Other" && <input className={`${inputClass} ${invalid("accommodationOther")} ml-2 max-w-[220px]`} placeholder="Specify*" value={formData.accommodationOther} onChange={(e) => updateField("accommodationOther", e.target.value)} ref={(e) => setRef("accommodationOther", e)} />}</label>)}</div>}

                <button type="button" className="w-full rounded-md border border-border px-3 py-2 text-left text-sm font-semibold text-navy" onClick={() => toggleExpand("equipment")}>Work clothing & footwear {expanded.equipment ? "▲" : "▼"}</button>
                {expanded.equipment && <div className={groupErrorClass("equipment")}>{["Yes — provided by employer", "No — worker provides own", "Partially — PPE only provided", "Other"].map((v, i) => <label key={v} className={radioClass}><input type="radio" className="shrink-0" checked={formData.equipment === v} onChange={() => updateField("equipment", v)} ref={(e) => { if (i === 0) setRef("equipment", e); }} />{v}{v === "Other" && formData.equipment === "Other" && <input className={`${inputClass} ${invalid("equipmentOther")} ml-2 max-w-[220px]`} placeholder="Specify*" value={formData.equipmentOther} onChange={(e) => updateField("equipmentOther", e.target.value)} ref={(e) => setRef("equipmentOther", e)} />}</label>)}</div>}

                <button type="button" className="w-full rounded-md border border-border px-3 py-2 text-left text-sm font-semibold text-navy" onClick={() => toggleExpand("tools")}>Tools {expanded.tools ? "▲" : "▼"}</button>
                {expanded.tools && <div className={groupErrorClass("tools")}>{["Yes — provided", "No — worker brings own", "Not required", "Other"].map((v, i) => <label key={v} className={radioClass}><input type="radio" className="shrink-0" checked={formData.tools === v} onChange={() => updateField("tools", v)} ref={(e) => { if (i === 0) setRef("tools", e); }} />{v}{v === "Other" && formData.tools === "Other" && <input className={`${inputClass} ${invalid("toolsOther")} ml-2 max-w-[220px]`} placeholder="Specify*" value={formData.toolsOther} onChange={(e) => updateField("toolsOther", e.target.value)} ref={(e) => setRef("toolsOther", e)} />}</label>)}</div>}
              </div>
            )}

            {step === 8 && (
              <div className="space-y-3">
                <h2 className={titleClass}>Final details</h2>
                <label className={labelClass}>Work location / city</label>
                <input className={`${inputClass} ${invalid("city")}`} placeholder="Work location / city*" value={formData.city} onChange={(e) => updateField("city", e.target.value)} ref={(e) => setRef("city", e)} />

                <button type="button" className="w-full rounded-md border border-border px-3 py-2 text-left text-sm font-semibold text-navy" onClick={() => toggleExpand("startDate")}>Preferred start date {expanded.startDate ? "▲" : "▼"}</button>
                {expanded.startDate && <div className="space-y-2">{["ASAP", "1-2 weeks", "Within 1 month", "Flexible", "Other"].map((v, i) => <label key={v} className={radioClass}><input type="radio" className="shrink-0" checked={formData.startDate === v} onChange={() => updateField("startDate", v)} ref={(e) => { if (i === 0) setRef("startDate", e); }} />{v}{v === "Other" && formData.startDate === "Other" && <input type="date" className={`${inputClass} ${invalid("startDateOther")} ml-2 max-w-[220px]`} value={formData.startDateOther} onChange={(e) => updateField("startDateOther", e.target.value)} ref={(e) => setRef("startDateOther", e)} />}</label>)}</div>}

                <button type="button" className="w-full rounded-md border border-border px-3 py-2 text-left text-sm font-semibold text-navy" onClick={() => toggleExpand("hear")}>How did you hear about us? {expanded.hear ? "▲" : "▼"}</button>
                {expanded.hear && (
                  <div className="space-y-2">
                    {howDidYouHearOptions.map((v, i) => (
                      <div key={v} className="space-y-2">
                        <label className={radioClass}>
                          <input
                            type="radio"
                            className="shrink-0"
                            checked={formData.howDidYouHear === v}
                            onChange={() => {
                              updateField("howDidYouHear", v);
                              updateField("socialMediaOther", "");
                              updateField("howDidYouHearOther", "");
                              if (v !== "Referral from another company") {
                                updateField("referralCompanyName", "");
                                updateField("referralOrgNumber", "");
                                updateField("referralEmail", "");
                              }
                            }}
                            ref={(e) => {
                              if (i === 0) setRef("howDidYouHear", e);
                            }}
                          />
                          {v}
                        </label>
                        {v === "Referral from another company" && formData.howDidYouHear === "Referral from another company" && (
                          <div className="relative rounded-md border border-border p-3">
                            <input className={`${inputClass} ${invalid("referralCompanyName")}`} placeholder="Referring company*" value={formData.referralCompanyName} onChange={(e) => { updateField("referralCompanyName", e.target.value); updateField("referralOrgNumber", ""); }} ref={(e) => setRef("referralCompanyName", e)} />
                            {isSearchingReferral && <p className="mt-1 text-xs text-text-secondary">Searching...</p>}
                            {!isSearchingReferral && (referralResults.length > 0 || hasSearchedReferral) && (
                              <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-md">
                                {referralResults.map((item) => (
                                  <button key={`${item.orgNumber}-${item.name}`} type="button" className="block w-full border-b border-border px-3 py-2 text-left text-sm hover:bg-gold/10" onClick={() => { updateField("referralCompanyName", item.name); updateField("referralOrgNumber", item.orgNumber); setReferralResults([]); setHasSearchedReferral(false); }}>
                                    <div>{item.name}</div>
                                    <div className="text-xs text-gold">Org.nr. {item.orgNumber}</div>
                                  </button>
                                ))}
                                {!referralResults.length && <div className="px-3 py-2 text-xs text-text-secondary">No company found - you can continue.</div>}
                              </div>
                            )}
                            <input type="email" className={`${inputClass} mt-2`} placeholder="Referral contact email (optional)" value={formData.referralEmail} onChange={(e) => updateField("referralEmail", e.target.value)} />
                          </div>
                        )}
                      </div>
                    ))}
                    {formData.howDidYouHear === "Social media" && (
                      <div className="space-y-2 rounded-md border border-border p-3">
                        <label className={labelClass}>Platform</label>
                        <select className={inputClass} value={formData.socialMediaPlatform} onChange={(e) => { updateField("socialMediaPlatform", e.target.value); updateField("socialMediaOther", ""); }}>
                          {["Facebook", "Instagram", "LinkedIn", "TikTok", "YouTube", "Twitter/X", "Snapchat", "Pinterest", "Reddit", "WhatsApp", "Other"].map((p) => <option key={p}>{p}</option>)}
                        </select>
                        {formData.socialMediaPlatform === "Other" && <input className={`${inputClass} ${invalid("socialMediaOther")}`} placeholder="Specify social media*" value={formData.socialMediaOther} onChange={(e) => updateField("socialMediaOther", e.target.value)} ref={(e) => setRef("socialMediaOther", e)} />}
                      </div>
                    )}
                    {formData.howDidYouHear === "Other" && <input className={`${inputClass} ${invalid("howDidYouHearOther")}`} placeholder="Please specify*" value={formData.howDidYouHearOther} onChange={(e) => updateField("howDidYouHearOther", e.target.value)} ref={(e) => setRef("howDidYouHearOther", e)} />}
                    
                  </div>
                )}

                <div className="space-y-2">
                  {["Yes - send me candidate updates", "No thanks"].map((v, i) => (
                    <label key={v} className={radioClass}>
                      <input
                        type="radio"
                        className="shrink-0"
                        checked={formData.subscribe === v}
                        onChange={() => {
                          if (v === "No thanks") return setConfirmNoSubscribe(true);
                          updateField("subscribe", v);
                        }}
                        ref={(e) => {
                          if (i === 0) setRef("subscribe", e);
                        }}
                      />
                      {v}
                    </label>
                  ))}
                </div>
                <label className={labelClass}>Additional notes</label>
                <textarea rows={3} className={inputClass} placeholder="Additional notes (optional)" value={formData.notes} onChange={(e) => updateField("notes", e.target.value)} />
                <button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#C9A84C] py-2 text-sm font-medium text-white hover:bg-gold-hover disabled:opacity-70">
                  {isSubmitting ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Submitting...</> : "Submit request"}
                </button>
              </div>
            )}
          </div>

          {stepError && <p className="text-sm text-red-600">{stepError}</p>}
          {submitStatus === "error" && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError || "Something went wrong."}</div>}

          <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
            <button type="button" onClick={back} disabled={step === 0} className="rounded-md border border-[#0D1B2A] px-4 py-2 text-sm text-[#0D1B2A] disabled:opacity-40">Back</button>
            {step < 8 && <button type="button" onClick={next} className="rounded-md bg-[#C9A84C] px-4 py-2 text-sm font-medium text-white hover:bg-gold-hover">Next</button>}
          </div>
        </form>
      </div>

      {confirmNoSubscribe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl">
            <p className="text-sm text-navy">Without email subscription we cannot send you candidate presentations. Are you sure?</p>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" className="rounded-md border border-border px-3 py-2 text-sm" onClick={() => setConfirmNoSubscribe(false)}>Go back and subscribe</button>
              <button type="button" className="rounded-md bg-[#C9A84C] px-3 py-2 text-sm text-white" onClick={() => { updateField("subscribe", "No thanks"); setConfirmNoSubscribe(false); }}>Yes, I understand</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
