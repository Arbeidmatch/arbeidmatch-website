import { redirect } from "next/navigation";
import {
  recordGuideAccess,
  resolveGuidePageState,
  type DsbGuideSlug,
} from "@/lib/dsbGuideAccess";
import { extractToc, readDsbGuideMarkdown } from "@/lib/dsbGuideMarkdown";
import DsbAccessDenied from "@/components/dsb/DsbAccessDenied";
import DsbGuidePending from "@/components/dsb/DsbGuidePending";
import DsbGuideViewer from "@/components/dsb/DsbGuideViewer";

type Props = {
  guideSlug: DsbGuideSlug;
  token?: string;
};

export async function DsbGuidePage({ guideSlug, token }: Props) {
  const state = await resolveGuidePageState(token, guideSlug);

  if (state.kind === "free_public") {
    const markdown = await readDsbGuideMarkdown(guideSlug);
    const toc = extractToc(markdown);
    return (
      <DsbGuideViewer
        markdown={markdown}
        toc={toc}
        guideSlug={guideSlug}
        accessMode="public"
      />
    );
  }

  if (state.kind === "missing") {
    redirect("/dsb-support?access=required");
  }

  if (state.kind === "invalid" || state.kind === "wrong_guide" || state.kind === "expired") {
    return <DsbAccessDenied kind={state.kind} guideSlug={guideSlug} />;
  }

  if (state.kind === "pending") {
    return <DsbGuidePending token={token!} />;
  }

  await recordGuideAccess(state.purchaseId);

  const markdown = await readDsbGuideMarkdown(guideSlug);
  const toc = extractToc(markdown);

  return (
    <DsbGuideViewer
      markdown={markdown}
      toc={toc}
      email={state.email}
      expiresAtIso={state.tokenExpiresAt}
      guideSlug={guideSlug}
      accessMode="licensed"
    />
  );
}
