import type { Metadata } from "next";
import { CvBuilder } from "@/app/cv-gen/_components/CvBuilder";
import { getPolicyVersion } from "@/lib/cv/consent";
import { SAMPLE_CV } from "@/lib/cv/fixtures/sample-cv";

export const metadata: Metadata = {
  title: "Build your CV",
  description:
    "Free CV builder for jobs in Norway. Pick a layout, fill in the guided form and download an ATS ready PDF in English.",
  robots: { index: false, follow: true },
};

/** `?demo=1` seeds the builder with the fixture for guide screenshots. Never in production. */
function demoAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview";
}

export default async function CvGenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const demo = params.demo === "1" && demoAllowed() ? SAMPLE_CV : null;

  return <CvBuilder policyVersion={getPolicyVersion()} demo={demo} />;
}
