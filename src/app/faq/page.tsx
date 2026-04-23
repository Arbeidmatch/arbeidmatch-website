import FaqClient from "./FaqClient";
import { requireFeatureFlag } from "@/lib/featureFlag";

export default function FaqPage() {
  requireFeatureFlag();
  return <FaqClient />;
}
