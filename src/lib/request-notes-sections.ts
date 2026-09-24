/**
 * The lists the wizard writes into its notes, read back as lists.
 *
 * The office copy of a request used to leave out the work tasks, the personal
 * qualities and what the employer offers: they exist only as blocks inside the
 * wizard's `notes` ("Work Tasks", then "- item" lines). His ask of 24 September
 * 2026: the office mail shows everything the client filled in. The blocks are
 * written by `generatedNotes` in src/app/request/[token]/page.tsx; the headings
 * here are the ones it writes.
 */

export type NotesLists = {
  workTasks: string[];
  personalQualities: string[];
  weOffer: string[];
};

const HEADINGS: Record<keyof NotesLists, string> = {
  workTasks: "Work Tasks",
  personalQualities: "Personal Qualities",
  weOffer: "We Offer",
};

/** The "- item" lines under one heading, up to the first line that is not an item. */
function itemsUnder(lines: string[], heading: string): string[] {
  const at = lines.findIndex((line) => line.trim() === heading);
  if (at < 0) return [];
  const items: string[] = [];
  for (const line of lines.slice(at + 1)) {
    const m = line.match(/^\s*-\s+(.*\S)\s*$/);
    if (!m) break;
    items.push(m[1]);
  }
  return items;
}

export function notesLists(notes: string | null | undefined): NotesLists {
  const lines = String(notes ?? "").split(/\r?\n/);
  return {
    workTasks: itemsUnder(lines, HEADINGS.workTasks),
    personalQualities: itemsUnder(lines, HEADINGS.personalQualities),
    weOffer: itemsUnder(lines, HEADINGS.weOffer),
  };
}

/** "Contact person's role: X" in the requirements text, which is the only place the wizard puts it. */
export function contactRoleFrom(requirements: string | null | undefined): string {
  const m = String(requirements ?? "").match(/^Contact person's role:\s*(.+?)\s*$/m);
  return m ? m[1] : "";
}
