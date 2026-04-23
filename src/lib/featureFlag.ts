import { notFound } from "next/navigation";

export function requireFeatureFlag() {
  if (process.env.NEXT_PUBLIC_FEATURE_FLAG !== "enabled") {
    notFound();
  }
}
