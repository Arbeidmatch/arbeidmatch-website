import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import EmployerCandidateReviewClient from "./EmployerCandidateReviewClient";

export const metadata: Metadata = {
  title: "Candidate review",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ applicationId: string }> };

export default async function EmployerCandidatePage({ params }: Props) {
  const { applicationId } = await params;
  return (
    <div className="bg-[#0D1B2A] pb-20 pt-8 text-white">
      <div className="container-site max-w-4xl">
        <Suspense
          fallback={
            <div className="flex min-h-[40vh] items-center justify-center gap-2 text-white/70">
              <Loader2 className="h-6 w-6 animate-spin text-[#C9A84C]" aria-hidden />
              <span className="text-sm">Loading...</span>
            </div>
          }
        >
          <EmployerCandidateReviewClient applicationId={applicationId} />
        </Suspense>
      </div>
    </div>
  );
}
