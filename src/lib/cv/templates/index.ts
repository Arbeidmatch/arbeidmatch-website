import type { ComponentType } from "react";
import type { TemplateId } from "@/lib/cv/schema";
import type { TemplateProps } from "@/lib/cv/templates/shared";
import { ClassicLinear } from "@/lib/cv/templates/classic-linear";
import { ModernHeader } from "@/lib/cv/templates/modern-header";
import { TwoColumnRight } from "@/lib/cv/templates/two-column-right";
import { LabelLeft } from "@/lib/cv/templates/label-left";
import { CompactSidebar } from "@/lib/cv/templates/compact-sidebar";

export const CV_TEMPLATES: Record<TemplateId, ComponentType<TemplateProps>> = {
  "classic-linear": ClassicLinear,
  "modern-header": ModernHeader,
  "two-column-right": TwoColumnRight,
  "label-left": LabelLeft,
  "compact-sidebar": CompactSidebar,
};

export { CoverLetter } from "@/lib/cv/templates/cover-letter";
export type { TemplateProps };
