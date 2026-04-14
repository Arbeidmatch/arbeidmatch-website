"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

const inputClass =
  "w-full rounded-md border border-border px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold";
const labelClass = "mb-1 block text-sm font-medium text-navy";

type TokenData = { company: string; email: string; job_summary: string; org_number?: string };
type CompanyResult = { name: string; orgNumber: string };

type RequestForm = {
  full_name: string;
  phone: string;
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
  paslagPercent: string;
  salary: string;
  fullTime: string;
  hoursUnit: "Per day" | "Per week" | "Per month";
  hoursAmount: string;
  overtime: string;
  maxOvertimeHours: string;
  hasRotation: string;
  rotationWeeksOn: string;
  rotationWeeksOff: string;
  accommodationCost: string;
  travel: string;
  travelOther: string;
  accommodation: string;
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

const rolesByCategory: Record<string, string[]> = {
  Construction: ["Carpenter", "Bricklayer", "Tile layer", "Painter", "Plasterer", "Roofer", "Concrete worker"],
  "Civil Engineering (Anlegg)": ["Excavator operator", "Road worker", "Asphalt worker", "Crane operator"],
  "Industry & Logistics": ["Forklift operator", "Warehouse worker", "Machine operator", "Welder", "Driver"],
  "Cleaning & Facility": ["Cleaner", "Janitor", "Facility technician"],
  "Electrical & Mechanical": ["Electrician", "Plumber", "HVAC technician", "Mechanic"],
  Other: [],
};

function FieldError({ show }: { show: boolean }) {
  return show ? <span className="text-red-600">*</span> : null;
}

export default function DetailedRequestPage() {
  const { token } = useParams<{ token: string }>();
  const [tokenStatus, setTokenStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [stepError, setStepError] = useState("");
  const [invalidField, setInvalidField] = useState("");
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [referralResults, setReferralResults] = useState<CompanyResult[]>([]);
  const [isSearchingReferral, setIsSearchingReferral] = useState(false);
  const [hasSearchedReferral, setHasSearchedReferral] = useState(false);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const [formData, setFormData] = useState<RequestForm>({
    full_name: "",
    phone: "",
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
    paslagPercent: "",
    salary: "",
    fullTime: "",
    hoursUnit: "Per week",
    hoursAmount: "",
    overtime: "",
    maxOvertimeHours: "",
    hasRotation: "",
    rotationWeeksOn: "",
    rotationWeeksOff: "",
    accommodationCost: "",
    travel: "",
    travelOther: "",
    accommodation: "",
    accommodationOther: "",
    equipment: "",
    equipmentOther: "",
    tools: "",
    toolsOther: "",
    city: "",
    startDate: "",
    startDateOther: "",
    howDidYouHear: "Google search",
    socialMediaPlatform: "Facebook",
    socialMediaOther: "",
    howDidYouHearOther: "",
    referralCompanyName: "",
    referralOrgNumber: "",
    referralEmail: "",
    subscribe: "",
    notes: "",
  });

  const stepCount = 8;
  const progress = ((step + 1) / stepCount) * 100;
  const roles = rolesByCategory[formData.category] ?? [];
  const needsPaslag = formData.contractType.includes("bemanningsbyrå") || formData.contractType.includes("Innleie");
  const certOptions = useMemo(() => {
    const key = formData.position || formData.positionOther;
    const map: Record<string, string[]> = {
      Welder: ["ISO 9606-1", "Offshore welding certificate", "Other"],
      Electrician: ["Fagbrev elektriker", "DSB authorization", "Other"],
      "Crane operator": ["Crane operator certificate G1-G11", "Other"],
      "Forklift operator": ["Forklift certificate T1-T8", "Other"],
      Driver: ["License CE", "ADR certificate", "Other"],
      Plumber: ["Fagbrev rørlegger", "Other"],
    };
    return map[key] ?? ["Other"];
  }, [formData.position, formData.positionOther]);

  const setFieldRef = (name: string, el: HTMLElement | null) => {
    fieldRefs.current[name] = el;
  };
  const updateField = (name: keyof RequestForm, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const toggleCertification = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.includes(value)
        ? prev.certifications.filter((item) => item !== value)
        : [...prev.certifications, value],
    }));
  };
  const focusField = (name: string) => {
    const el = fieldRefs.current[name];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => el.focus(), 50);
  };

  useEffect(() => {
    const verify = async () => {
      try {
        const v = await fetch(`/api/verify-token?token=${token}`).then((r) => r.json());
        if (!v.valid) return setTokenStatus("invalid");
        const t = await fetch(`/api/token-data/${token}`).then((r) => r.json());
        if (!t.success || !t.data) return setTokenStatus("invalid");
        setTokenData(t.data);
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
        const response = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(formData.referralCompanyName)}&size=10`);
        const data = (await response.json()) as { _embedded?: { enheter?: Array<{ navn?: string; organisasjonsnummer?: string }> } };
        setReferralResults((data._embedded?.enheter ?? []).map((item) => ({ name: item.navn ?? "", orgNumber: item.organisasjonsnummer ?? "" })));
      } catch {
        setReferralResults([]);
      } finally {
        setIsSearchingReferral(false);
        setHasSearchedReferral(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.howDidYouHear, formData.referralCompanyName]);

  const validateStep = (s: number): string | null => {
    const phone = formData.phone.replace(/\s+/g, "");
    if (s === 0) {
      if (!formData.full_name.trim()) return "full_name";
      if (!/^\+47\d{8}$/.test(phone) && !/^\d{8}$/.test(phone)) return "phone";
    }
    if (s === 1 && !formData.hiringType) return "hiringType";
    if (s === 2) {
      if (!formData.category) return "category";
      if (formData.category === "Other" && !formData.positionOther.trim()) return "positionOther";
      if (formData.category !== "Other" && !formData.position) return "position";
    }
    if (s === 3) {
      if (!formData.numberOfPositions) return "numberOfPositions";
      if (!formData.qualification) return "qualification";
      if (!formData.experience) return "experience";
      if (!formData.norwegianLevel) return "norwegianLevel";
      if (!formData.englishLevel) return "englishLevel";
      if (formData.certifications.includes("Other") && !formData.certificationsOther.trim()) return "certificationsOther";
    }
    if (s === 4) {
      if (!formData.driverLicense) return "driverLicense";
      if (formData.driverLicense === "Other" && !formData.driverLicenseOther.trim()) return "driverLicenseOther";
      if (!formData.dNumber) return "dNumber";
      if (formData.dNumber === "Other" && !formData.dNumberOther.trim()) return "dNumberOther";
    }
    if (s === 5) {
      if (!formData.contractType) return "contractType";
      if (needsPaslag && !formData.paslagPercent) return "paslagPercent";
      if (!formData.salary) return "salary";
      if (!formData.fullTime) return "fullTime";
      if (!formData.hoursAmount) return "hoursAmount";
      if (!formData.overtime) return "overtime";
      if (formData.overtime !== "No" && !formData.maxOvertimeHours) return "maxOvertimeHours";
      if (!formData.hasRotation) return "hasRotation";
      if (formData.hasRotation.startsWith("Yes") && (!formData.rotationWeeksOn || !formData.rotationWeeksOff)) return !formData.rotationWeeksOn ? "rotationWeeksOn" : "rotationWeeksOff";
      if (!formData.accommodationCost) return "accommodationCost";
    }
    if (s === 6) {
      if (!formData.travel) return "travel";
      if (formData.travel === "Other" && !formData.travelOther.trim()) return "travelOther";
      if (!formData.accommodation) return "accommodation";
      if (formData.accommodation === "Other" && !formData.accommodationOther.trim()) return "accommodationOther";
      if (!formData.equipment) return "equipment";
      if (formData.equipment === "Other" && !formData.equipmentOther.trim()) return "equipmentOther";
      if (!formData.tools) return "tools";
      if (formData.tools === "Other" && !formData.toolsOther.trim()) return "toolsOther";
    }
    if (s === 7) {
      if (!formData.city.trim()) return "city";
      if (!formData.startDate) return "startDate";
      if (formData.startDate === "Other" && !formData.startDateOther) return "startDateOther";
      if (formData.howDidYouHear === "Social media" && formData.socialMediaPlatform === "Other" && !formData.socialMediaOther.trim()) return "socialMediaOther";
      if (formData.howDidYouHear === "Other" && !formData.howDidYouHearOther.trim()) return "howDidYouHearOther";
      if (formData.howDidYouHear === "Referral from another company" && !formData.referralCompanyName.trim()) return "referralCompanyName";
      if (!formData.subscribe) return "subscribe";
    }
    return null;
  };

  const goToStep = (nextStep: number) => {
    setVisible(false);
    setTimeout(() => {
      setStep(nextStep);
      setVisible(true);
    }, 300);
  };
  const nextStep = () => {
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
    if (step < stepCount - 1) goToStep(step + 1);
  };
  const prevStep = () => {
    setStepError("");
    setInvalidField("");
    window.scrollTo({ top: 0, behavior: "auto" });
    if (step > 0) goToStep(step - 1);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const invalid = validateStep(step);
    if (invalid) {
      setInvalidField(invalid);
      setStepError("Please complete all required fields in this section.");
      focusField(invalid);
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus("idle");
    const payload = {
      ...formData,
      token,
      phone: formData.phone.replace(/\s+/g, ""),
      company: tokenData?.company ?? "",
      orgNumber: tokenData?.org_number ?? "",
      email: tokenData?.email ?? "",
      job_summary: tokenData?.job_summary ?? "",
      certifications: formData.certifications.join(", "),
    };
    try {
      const e = await fetch("/api/send-request-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!e.ok) throw new Error("email");
      const s = await fetch("/api/save-employer-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!s.ok) throw new Error("save");
      await fetch(`/api/verify-token?token=${token}`, { method: "DELETE" });
      setSubmitStatus("success");
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardClass = `rounded-xl bg-white p-5 shadow-[0_10px_30px_rgba(13,27,42,0.08)] transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`;
  const errorClass = (name: string) => `${inputClass} ${invalidField === name ? "border-red-500" : ""}`;

  if (tokenStatus === "checking") return <section className="bg-surface py-16"><div className="mx-auto w-full max-w-content px-4 text-center md:px-6"><p className="text-text-secondary">Verifying your access...</p></div></section>;
  if (tokenStatus === "invalid") return <section className="bg-surface py-16"><div className="mx-auto w-full max-w-content px-4 text-center md:px-6"><h1 className="text-3xl font-bold text-navy">Link expired or invalid</h1><p className="mt-4 text-text-secondary">This link has expired or is no longer valid. Please <a href="/request" className="font-semibold text-gold">start a new request →</a></p></div></section>;
  if (submitStatus === "success") return <section className="bg-surface py-20"><div className="mx-auto w-full max-w-content px-4 md:px-6"><div className="rounded-xl bg-white p-8 text-center shadow-sm"><h1 className="text-3xl font-bold text-navy">Request sent successfully</h1><p className="mt-3 text-text-secondary">Thank you. Our team will review your request and contact you within 24 hours.</p></div></div></section>;

  return (
    <section className="bg-surface py-10">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <h1 className="text-4xl font-bold text-[#0D1B2A]">Candidate Request - Details</h1>
        <p className="mt-2 text-text-secondary">Complete all steps to submit your candidate request.</p>
        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white"><div className="h-full bg-[#C9A84C] transition-all duration-300" style={{ width: `${progress}%` }} /></div>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className={cardClass}>
            {step === 0 && <div className="space-y-3"><h2 className="text-xl font-semibold text-[#0D1B2A]">Who should we contact?</h2><label><span className={labelClass}>Full name <FieldError show /></span><input className={errorClass("full_name")} value={formData.full_name} onChange={(e) => updateField("full_name", e.target.value)} onBlur={() => updateField("full_name", formData.full_name.trim().split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" "))} ref={(e) => setFieldRef("full_name", e)} /></label><label><span className={labelClass}>Phone <FieldError show /></span><input className={errorClass("phone")} value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} ref={(e) => setFieldRef("phone", e)} /><p className="mt-1 text-xs text-text-secondary">Format: +47XXXXXXXX or 8 digits</p></label></div>}
            {step === 1 && <div className="space-y-3"><h2 className="text-xl font-semibold text-[#0D1B2A]">Type of engagement</h2>{["Candidate delivery", "Recruitment", "Staffing"].map((v, i) => <label key={v} className="block rounded-md border border-border p-3 text-sm text-navy"><input type="radio" className="mr-2" checked={formData.hiringType === v} onChange={() => updateField("hiringType", v)} ref={(e) => { if (i === 0) setFieldRef("hiringType", e); }} />{v}</label>)}</div>}
            {step === 2 && <div className="space-y-3"><h2 className="text-xl font-semibold text-[#0D1B2A]">Sector & Role</h2><label><span className={labelClass}>Category <FieldError show /></span><select className={errorClass("category")} value={formData.category} onChange={(e) => { updateField("category", e.target.value); updateField("position", ""); updateField("positionOther", ""); }} ref={(e) => setFieldRef("category", e)}><option value="">Select category</option>{Object.keys(rolesByCategory).map((category) => <option key={category}>{category}</option>)}</select></label>{formData.category && formData.category !== "Other" && <label><span className={labelClass}>Role <FieldError show /></span><select className={errorClass("position")} value={formData.position} onChange={(e) => updateField("position", e.target.value)} ref={(e) => setFieldRef("position", e)}><option value="">Select role</option>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>}{formData.category === "Other" && <label><span className={labelClass}>Position (other) <FieldError show /></span><input className={errorClass("positionOther")} value={formData.positionOther} onChange={(e) => updateField("positionOther", e.target.value)} ref={(e) => setFieldRef("positionOther", e)} /></label>}</div>}
            {step === 3 && <div className="space-y-3"><h2 className="text-xl font-semibold text-[#0D1B2A]">Qualification & Certifications</h2><label><span className={labelClass}>Number of candidates needed <FieldError show /></span><input type="number" className={errorClass("numberOfPositions")} value={formData.numberOfPositions} onChange={(e) => updateField("numberOfPositions", e.target.value)} ref={(e) => setFieldRef("numberOfPositions", e)} /></label><p className={labelClass}>Experience level <FieldError show /></p>{["No experience needed - entry level workers", "Some experience - no formal certificate required", "Certified - foreign trade certificate accepted", "Fully certified - Norwegian or DSB-approved certificate required"].map((v, i) => <label key={v} className="block rounded-md border border-border p-3 text-sm text-navy"><input type="radio" className="mr-2" checked={formData.qualification === v} onChange={() => updateField("qualification", v)} ref={(e) => { if (i === 0) setFieldRef("qualification", e); }} />{v}</label>)}<p className={labelClass}>Required certifications</p>{certOptions.map((c) => <label key={c} className="block rounded-md border border-border p-3 text-sm text-navy"><input type="checkbox" className="mr-2" checked={formData.certifications.includes(c)} onChange={() => toggleCertification(c)} />{c}</label>)}{formData.certifications.includes("Other") && <label><span className={labelClass}>Other certification <FieldError show /></span><input className={errorClass("certificationsOther")} value={formData.certificationsOther} onChange={(e) => updateField("certificationsOther", e.target.value)} ref={(e) => setFieldRef("certificationsOther", e)} /></label>}<label><span className={labelClass}>Minimum years of experience <FieldError show /></span><input type="number" className={errorClass("experience")} value={formData.experience} onChange={(e) => updateField("experience", e.target.value)} ref={(e) => setFieldRef("experience", e)} /></label><p className={labelClass}>Norwegian level <FieldError show /></p>{["Not required", "Basic", "Working level", "Fluent"].map((v, i) => <label key={`n-${v}`} className="block rounded-md border border-border p-3 text-sm text-navy"><input type="radio" className="mr-2" checked={formData.norwegianLevel === v} onChange={() => updateField("norwegianLevel", v)} ref={(e) => { if (i === 0) setFieldRef("norwegianLevel", e); }} />{v}</label>)}<p className={labelClass}>English level <FieldError show /></p>{["Not required", "Basic", "Working level", "Fluent"].map((v, i) => <label key={`e-${v}`} className="block rounded-md border border-border p-3 text-sm text-navy"><input type="radio" className="mr-2" checked={formData.englishLevel === v} onChange={() => updateField("englishLevel", v)} ref={(e) => { if (i === 0) setFieldRef("englishLevel", e); }} />{v}</label>)}</div>}
            {step === 4 && <div className="space-y-3"><h2 className="text-xl font-semibold text-[#0D1B2A]">Requirements</h2><p className={labelClass}>Driver's license <FieldError show /></p>{["None", "B", "B+", "C", "C1", "CE", "D", "T", "Other"].map((v, i) => <label key={v} className="block rounded-md border border-border p-3 text-sm text-navy"><input type="radio" className="mr-2" checked={formData.driverLicense === v} onChange={() => updateField("driverLicense", v)} ref={(e) => { if (i === 0) setFieldRef("driverLicense", e); }} />{v}</label>)}{formData.driverLicense === "Other" && <label><span className={labelClass}>Other driver's license <FieldError show /></span><input className={errorClass("driverLicenseOther")} value={formData.driverLicenseOther} onChange={(e) => updateField("driverLicenseOther", e.target.value)} ref={(e) => setFieldRef("driverLicenseOther", e)} /></label>}<p className={labelClass}>D-number requirement <FieldError show /></p>{["Not required - we can help arrange", "Required before start", "Other"].map((v, i) => <label key={v} className="block rounded-md border border-border p-3 text-sm text-navy"><input type="radio" className="mr-2" checked={formData.dNumber === v} onChange={() => updateField("dNumber", v)} ref={(e) => { if (i === 0) setFieldRef("dNumber", e); }} />{v}</label>)}{formData.dNumber === "Other" && <label><span className={labelClass}>Other D-number requirement <FieldError show /></span><input className={errorClass("dNumberOther")} value={formData.dNumberOther} onChange={(e) => updateField("dNumberOther", e.target.value)} ref={(e) => setFieldRef("dNumberOther", e)} /></label>}<label><span className={labelClass}>Deal breakers (optional)</span><textarea rows={3} className={inputClass} value={formData.requirements} onChange={(e) => updateField("requirements", e.target.value)} /></label></div>}
            {step === 5 && <div className="space-y-3"><h2 className="text-xl font-semibold text-[#0D1B2A]">Contract & Pay</h2><label><span className={labelClass}>Contract type <FieldError show /></span><select className={errorClass("contractType")} value={formData.contractType} onChange={(e) => updateField("contractType", e.target.value)} ref={(e) => setFieldRef("contractType", e)}><option value="">Select contract type</option><option>Fast ansettelse - direkte hos klient</option><option>Fast ansettelse - via bemanningsbyrå</option><option>Midlertidig ansettelse - direkte hos klient</option><option>Midlertidig ansettelse - via bemanningsbyrå</option><option>Innleie fra bemanningsbyrå</option><option>Selvstendig oppdragstaker</option><option>Sesongarbeid</option></select></label>{needsPaslag && <label><span className={labelClass}>Agency margin/paslag % <FieldError show /></span><input type="number" className={errorClass("paslagPercent")} value={formData.paslagPercent} onChange={(e) => updateField("paslagPercent", e.target.value)} ref={(e) => setFieldRef("paslagPercent", e)} /></label>}<label><span className={labelClass}>Starting salary NOK/hour <FieldError show /></span><input className={errorClass("salary")} value={formData.salary} onChange={(e) => updateField("salary", e.target.value)} ref={(e) => setFieldRef("salary", e)} /></label><label><span className={labelClass}>Position % (100 = full-time) <FieldError show /></span><input className={errorClass("fullTime")} value={formData.fullTime} onChange={(e) => updateField("fullTime", e.target.value)} ref={(e) => setFieldRef("fullTime", e)} /></label><p className={labelClass}>Hours unit <FieldError show /></p>{(["Per day", "Per week", "Per month"] as const).map((v) => <label key={v} className="block rounded-md border border-border p-3 text-sm text-navy"><input type="radio" className="mr-2" checked={formData.hoursUnit === v} onChange={() => updateField("hoursUnit", v)} />{v}</label>)}<label><span className={labelClass}>Hours amount <FieldError show /></span><input type="number" className={errorClass("hoursAmount")} value={formData.hoursAmount} onChange={(e) => updateField("hoursAmount", e.target.value)} ref={(e) => setFieldRef("hoursAmount", e)} /></label><p className={labelClass}>Overtime <FieldError show /></p>{["Yes - regular", "Occasionally", "No"].map((v, i) => <label key={v} className="block rounded-md border border-border p-3 text-sm text-navy"><input type="radio" className="mr-2" checked={formData.overtime === v} onChange={() => updateField("overtime", v)} ref={(e) => { if (i === 0) setFieldRef("overtime", e); }} />{v}</label>)}{formData.overtime !== "No" && formData.overtime && <label><span className={labelClass}>Max overtime hours per week <FieldError show /></span><input type="number" className={errorClass("maxOvertimeHours")} value={formData.maxOvertimeHours} onChange={(e) => updateField("maxOvertimeHours", e.target.value)} ref={(e) => setFieldRef("maxOvertimeHours", e)} /></label>}<p className={labelClass}>Rotation schedule <FieldError show /></p>{["Yes - rotation schedule applies", "No"].map((v, i) => <label key={v} className="block rounded-md border border-border p-3 text-sm text-navy"><input type="radio" className="mr-2" checked={formData.hasRotation === v} onChange={() => updateField("hasRotation", v)} ref={(e) => { if (i === 0) setFieldRef("hasRotation", e); }} />{v}</label>)}{formData.hasRotation.startsWith("Yes") && <div className="grid gap-3 sm:grid-cols-2"><label><span className={labelClass}>Weeks on <FieldError show /></span><input type="number" className={errorClass("rotationWeeksOn")} value={formData.rotationWeeksOn} onChange={(e) => updateField("rotationWeeksOn", e.target.value)} ref={(e) => setFieldRef("rotationWeeksOn", e)} /></label><label><span className={labelClass}>Weeks off <FieldError show /></span><input type="number" className={errorClass("rotationWeeksOff")} value={formData.rotationWeeksOff} onChange={(e) => updateField("rotationWeeksOff", e.target.value)} ref={(e) => setFieldRef("rotationWeeksOff", e)} /></label></div>}<label><span className={labelClass}>Accommodation cost NOK/month (0 if free) <FieldError show /></span><input className={errorClass("accommodationCost")} value={formData.accommodationCost} onChange={(e) => updateField("accommodationCost", e.target.value)} ref={(e) => setFieldRef("accommodationCost", e)} /></label></div>}
            {step === 6 && <div className="space-y-3"><h2 className="text-xl font-semibold text-[#0D1B2A]">Working Conditions</h2>{[["Travel", "travel", ["Fully covered", "Partially covered", "Not covered", "Other"], "travelOther"], ["Accommodation", "accommodation", ["Free accommodation provided", "Not included", "We help find it", "Other"], "accommodationOther"], ["Equipment", "equipment", ["Yes - provided by employer", "No - worker brings own", "Other"], "equipmentOther"], ["Tools", "tools", ["Yes - provided", "No - worker brings own", "Not required", "Other"], "toolsOther"]].map(([title, key, options, otherKey]) => <div key={key as string}><p className={labelClass}>{title as string} <FieldError show /></p>{(options as string[]).map((v, i) => <label key={v} className="block rounded-md border border-border p-3 text-sm text-navy"><input type="radio" className="mr-2" checked={formData[key as keyof RequestForm] === v} onChange={() => updateField(key as keyof RequestForm, v)} ref={(e) => { if (i === 0) setFieldRef(key as string, e); }} />{v}</label>)}{formData[key as keyof RequestForm] === "Other" && <label className="mt-2 block"><span className={labelClass}>Other {title as string} <FieldError show /></span><input className={errorClass(otherKey as string)} value={formData[otherKey as keyof RequestForm] as string} onChange={(e) => updateField(otherKey as keyof RequestForm, e.target.value)} ref={(e) => setFieldRef(otherKey as string, e)} /></label>}</div>)}</div>}
            {step === 7 && <div className="space-y-3"><h2 className="text-xl font-semibold text-[#0D1B2A]">Final Details</h2><label><span className={labelClass}>Work location / city <FieldError show /></span><input className={errorClass("city")} value={formData.city} onChange={(e) => updateField("city", e.target.value)} ref={(e) => setFieldRef("city", e)} /></label><p className={labelClass}>Preferred start date <FieldError show /></p>{["ASAP", "1-2 weeks", "Within 1 month", "Flexible", "Other"].map((v, i) => <label key={v} className="block rounded-md border border-border p-3 text-sm text-navy"><input type="radio" className="mr-2" checked={formData.startDate === v} onChange={() => updateField("startDate", v)} ref={(e) => { if (i === 0) setFieldRef("startDate", e); }} />{v}</label>)}{formData.startDate === "Other" && <label><span className={labelClass}>Select date <FieldError show /></span><input type="date" className={errorClass("startDateOther")} value={formData.startDateOther} onChange={(e) => updateField("startDateOther", e.target.value)} ref={(e) => setFieldRef("startDateOther", e)} /></label>}<label><span className={labelClass}>How did you hear about us <FieldError show /></span><select className={errorClass("howDidYouHear")} value={formData.howDidYouHear} onChange={(e) => { updateField("howDidYouHear", e.target.value); updateField("socialMediaOther", ""); updateField("howDidYouHearOther", ""); if (e.target.value !== "Referral from another company") { updateField("referralCompanyName", ""); updateField("referralOrgNumber", ""); updateField("referralEmail", ""); } }} ref={(e) => setFieldRef("howDidYouHear", e)}><option>Google search</option><option>Referral from another company</option><option>Referral from a friend</option><option>Social media</option><option>Other</option></select></label>{formData.howDidYouHear === "Social media" && <label><span className={labelClass}>Social media platform <FieldError show /></span><select className={inputClass} value={formData.socialMediaPlatform} onChange={(e) => { updateField("socialMediaPlatform", e.target.value); updateField("socialMediaOther", ""); }}>{["Facebook", "Instagram", "LinkedIn", "TikTok", "YouTube", "Twitter/X", "Snapchat", "Pinterest", "Reddit", "WhatsApp", "Other"].map((p) => <option key={p}>{p}</option>)}</select></label>}{formData.howDidYouHear === "Social media" && formData.socialMediaPlatform === "Other" && <label><span className={labelClass}>Other social media platform <FieldError show /></span><input className={errorClass("socialMediaOther")} value={formData.socialMediaOther} onChange={(e) => updateField("socialMediaOther", e.target.value)} ref={(e) => setFieldRef("socialMediaOther", e)} /></label>}{formData.howDidYouHear === "Other" && <label><span className={labelClass}>Please specify <FieldError show /></span><input className={errorClass("howDidYouHearOther")} value={formData.howDidYouHearOther} onChange={(e) => updateField("howDidYouHearOther", e.target.value)} ref={(e) => setFieldRef("howDidYouHearOther", e)} /></label>}{formData.howDidYouHear === "Referral from another company" && <><label className="relative block"><span className={labelClass}>Referring company <FieldError show /></span><input className={errorClass("referralCompanyName")} value={formData.referralCompanyName} onChange={(e) => { updateField("referralCompanyName", e.target.value); updateField("referralOrgNumber", ""); }} ref={(e) => setFieldRef("referralCompanyName", e)} />{(isSearchingReferral || referralResults.length > 0 || (hasSearchedReferral && formData.referralCompanyName.trim().length >= 2)) && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-white shadow-[0_8px_24px_rgba(13,27,42,0.12)]">{isSearchingReferral && <p className="px-3 py-2 text-sm text-text-secondary">Searching...</p>}{!isSearchingReferral && referralResults.map((item) => <button key={`${item.orgNumber}-${item.name}`} type="button" onClick={() => { updateField("referralCompanyName", item.name); updateField("referralOrgNumber", item.orgNumber); setReferralResults([]); setHasSearchedReferral(false); }} className="block w-full border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-gold/10"><span className="block text-sm font-medium text-navy">{item.name}</span><span className="block text-xs text-gold">Org.nr. {item.orgNumber}</span></button>)}{!isSearchingReferral && hasSearchedReferral && referralResults.length === 0 && <p className="px-3 py-2 text-sm text-text-secondary">No company found - you can still continue</p>}</div>}</label><label><span className={labelClass}>Contact email at referring company (optional)</span><input type="email" className={inputClass} value={formData.referralEmail} onChange={(e) => updateField("referralEmail", e.target.value)} /></label></>}{["Yes - send me candidate updates", "No thanks"].map((v, i) => <label key={v} className="block rounded-md border border-border p-3 text-sm text-navy"><input type="radio" className="mr-2" checked={formData.subscribe === v} onChange={() => updateField("subscribe", v)} ref={(e) => { if (i === 0) setFieldRef("subscribe", e); }} />{v}</label>)}<label><span className={labelClass}>Anything else we should know? (optional)</span><textarea rows={3} className={inputClass} value={formData.notes} onChange={(e) => updateField("notes", e.target.value)} /></label><button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-[#C9A84C] py-3 text-base font-medium text-white hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-70">{isSubmitting ? "Sending..." : "Submit request"}</button></div>}
          </div>
          {stepError && <p className="text-sm text-red-600">{stepError}</p>}
          {submitStatus === "error" && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Something went wrong. Please email post@arbeidmatch.no</div>}
          <div className="flex items-center justify-between">
            <button type="button" onClick={prevStep} disabled={step === 0} className="rounded-md border border-[#0D1B2A] px-5 py-2 text-sm text-[#0D1B2A] disabled:cursor-not-allowed disabled:opacity-40">Back</button>
            {step < stepCount - 1 && <button type="button" onClick={nextStep} className="rounded-md bg-[#C9A84C] px-5 py-2 text-sm font-medium text-white hover:bg-gold-hover">Next</button>}
          </div>
        </form>
      </div>
    </section>
  );
}
