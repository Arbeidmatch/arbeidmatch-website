import { CV_SUPPORT_EMAIL, controllerFooter } from "@/lib/cv/org";

export type CvEmailLang = "en" | "ro";

const COPY = {
  en: {
    otpSubject: "Your ArbeidMatch CV code",
    otpHeading: "Your verification code",
    otpIntro: "Use this code to confirm your consent and download your CV:",
    otpExpiry: "This code expires in 10 minutes. If you did not ask for it, you can ignore this email.",
    cvSubject: "Your CV from ArbeidMatch",
    cvHeading: "Your CV is ready",
    cvIntro: "Your CV is attached to this email. Keep it somewhere safe so you can send it to employers.",
    cvDataHeading: "Your data",
    cvDataIntro:
      "We created a work profile for you so we can match you with jobs. You can see everything we hold, export it, or delete it here:",
    cvDataLink: "See or delete my data",
    cvQuestions: `Questions? Write to ${CV_SUPPORT_EMAIL}.`,
  },
  ro: {
    otpSubject: "Codul tau ArbeidMatch pentru CV",
    otpHeading: "Codul tau de verificare",
    otpIntro: "Foloseste acest cod ca sa confirmi acordul si sa descarci CV-ul:",
    otpExpiry: "Codul expira in 10 minute. Daca nu l-ai cerut tu, poti ignora acest mesaj.",
    cvSubject: "CV-ul tau de la ArbeidMatch",
    cvHeading: "CV-ul tau este gata",
    cvIntro: "CV-ul este atasat la acest email. Pastreaza-l ca sa il poti trimite angajatorilor.",
    cvDataHeading: "Datele tale",
    cvDataIntro:
      "Ti-am creat un profil de lucru ca sa te putem potrivi cu joburi. Poti vedea tot ce detinem, poti exporta sau sterge totul aici:",
    cvDataLink: "Vezi sau sterge datele mele",
    cvQuestions: `Intrebari? Scrie la ${CV_SUPPORT_EMAIL}.`,
  },
} as const;

export function resolveLang(raw: string | null | undefined): CvEmailLang {
  return raw === "ro" ? "ro" : "en";
}

function shell(inner: string): string {
  return `<div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #0D1B2A;">
${inner}
  <hr style="border: none; border-top: 1px solid #E2E5EA; margin: 32px 0;">
  <p style="color: #55616D; font-size: 12px; line-height: 1.5;">${controllerFooter()}</p>
</div>`;
}

export function otpEmailSubject(lang: CvEmailLang): string {
  return COPY[lang].otpSubject;
}

export function buildOtpEmail(code: string, lang: CvEmailLang): string {
  const t = COPY[lang];
  const safeCode = code.replace(/\D/g, "");
  return shell(`  <h2 style="margin: 0 0 12px;">${t.otpHeading}</h2>
  <p style="line-height: 1.6;">${t.otpIntro}</p>
  <p style="font-size: 32px; font-weight: 700; letter-spacing: 0.25em; margin: 24px 0;">${safeCode}</p>
  <p style="color: #55616D; font-size: 14px; line-height: 1.6;">${t.otpExpiry}</p>`);
}

export function cvEmailSubject(lang: CvEmailLang): string {
  return COPY[lang].cvSubject;
}

export function buildCvEmail(myDataUrl: string, lang: CvEmailLang): string {
  const t = COPY[lang];
  return shell(`  <h2 style="margin: 0 0 12px;">${t.cvHeading}</h2>
  <p style="line-height: 1.6;">${t.cvIntro}</p>
  <h3 style="margin: 28px 0 8px; font-size: 16px;">${t.cvDataHeading}</h3>
  <p style="line-height: 1.6;">${t.cvDataIntro}</p>
  <p style="margin: 20px 0;">
    <a href="${myDataUrl}" style="background: #C9A84C; color: #0D1B2A; text-decoration: none; padding: 12px 20px; border-radius: 4px; font-weight: 700; display: inline-block;">${t.cvDataLink}</a>
  </p>
  <p style="color: #55616D; font-size: 14px; line-height: 1.6;">${t.cvQuestions}</p>`);
}
