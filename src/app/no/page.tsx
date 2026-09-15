import { permanentRedirect } from "next/navigation";

/** Norwegian presentation now lives at the canonical homepage. */
export default function NorwegianFrontPage() {
  permanentRedirect("/");
}
