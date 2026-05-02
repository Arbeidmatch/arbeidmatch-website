import { redirect } from "next/navigation";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { verifyDsbEmailVerifyToken } from "@/lib/dsbEmailVerifyToken";
import { redirectAfterDsbEmailVerifyToken } from "@/lib/dsbVerifyPaidRedirect";
import { isDsbPaymentEnabled } from "@/lib/dsbPaymentEnv";

export const dynamic = "force-dynamic";

export default async function DsbSupportVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  try {
    const { token } = await searchParams;
    const normalizedToken = token?.trim();

    if (!normalizedToken) {
      redirect("/dsb-support/eu?error=link_expired");
    }

    if (!isDsbPaymentEnabled()) {
      const payload = verifyDsbEmailVerifyToken(normalizedToken);
      if (!payload) {
        redirect("/dsb-support/eu?error=link_expired");
      }
      const dest = payload.guide_slug === "non-eu" ? "/dsb-support/non-eu" : "/dsb-support/eu";
      redirect(dest);
    }

    await redirectAfterDsbEmailVerifyToken(normalizedToken);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("[Verify Page] Unexpected error:", error);
    redirect("/dsb-support?error=verify_error");
  }
}
