import { redirect } from "next/navigation";

/**
 * The login form is a dialog now (the owner's decision of 29 September 2026:
 * no forms on pages). E-mails and old links still point here, so this sends
 * them to the portal with the login dialog open (#logg-inn, see PortalDialogs).
 */
export default function ProsjekterLoggInnPage(): never {
  redirect("/prosjekter#logg-inn");
}
