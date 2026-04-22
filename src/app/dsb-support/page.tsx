import { permanentRedirect } from "next/navigation";

/** Public DSB guide content lives on /electricians-norway#dsb-authorization-guide */
export default function DsbSupportPage() {
  permanentRedirect("/electricians-norway?section=dsb");
}
