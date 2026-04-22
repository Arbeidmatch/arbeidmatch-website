import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import BoardJobEditClient from "./BoardJobEditClient";

export const metadata: Metadata = {
  title: "Review job post",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ jobId: string }> };

export default async function BoardJobEditPage({ params }: Props) {
  const { jobId } = await params;
  return (
    <div className="bg-[#0D1B2A] pb-20 pt-8 text-white">
      <div className="container-site">
        <Suspense
          fallback={
            <div className="flex min-h-[40vh] items-center justify-center gap-2 text-white/70">
              <Loader2 className="h-6 w-6 animate-spin text-[#C9A84C]" aria-hidden />
              <span className="text-sm">Loading...</span>
            </div>
          }
        >
          <BoardJobEditClient jobId={jobId} />
        </Suspense>
      </div>
    </div>
  );
}
