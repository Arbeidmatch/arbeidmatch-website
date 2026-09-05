/**
 * The trade a posting is actually about, read from its title.
 *
 * WHY NOT `category`. Because it holds industries, not trades. The four values
 * on the live board on 3 September 2026 are Construction, Carpentry, Automotive
 * and Manufacturing, and two of them are wrong even as industries: three car
 * mechanic postings are filed under Construction and the DSB electricians under
 * Manufacturing. A page built on that column would be called "Construction jobs
 * in Bergen" and contain a car mechanic.
 *
 * A person does not search for an industry. They search for "tomrer jobb
 * Bergen", "bilmekaniker", "murer". So the trade comes out of the title, where
 * whoever wrote the advert put it, in whichever of the two languages they wrote.
 *
 * ONE CANONICAL NAME PER TRADE, in English, because the board's titles are in
 * English and the pages are addressed to somebody arriving from the EEA. The
 * Norwegian word is matched so a Norwegian-titled advert lands on the same page
 * rather than creating a second one for the same job.
 *
 * ORDER MATTERS. "Bilmekaniker" contains "mekaniker", and "hjelpearbeider" must
 * not be read as a carpenter because it appears next to one. Each entry is
 * tried in full before the next, most specific first.
 */

export type Trade = {
  /** What the page is called, and what goes in the heading. */
  name: string;
  /** The words that identify it, in English and Norwegian. */
  words: RegExp;
};

export const TRADES: readonly Trade[] = [
  { name: "Car mechanic", words: /\b(bilmekanikere?|car mechanics?|auto mechanics?|vehicle mechanics?|bilpleie)\b/i },
  { name: "Electrician", words: /\b(electricians?|elektrikere?|dsb)\b/i },
  { name: "Bricklayer", words: /\b(bricklayers?|murere?|masons?)\b/i },
  { name: "Concrete worker", words: /\b(concrete|betong|betongarbeider|forskaling)\b/i },
  { name: "Carpenter", words: /\b(carpenters?|t[øo]mrere?|snekkere?|joiners?)\b/i },
  { name: "Painter", words: /\b(painters?|malere?)\b/i },
  { name: "Welder", words: /\b(welders?|sveisere?)\b/i },
  { name: "Plumber", words: /\b(plumbers?|r[øo]rleggere?)\b/i },
  { name: "Scaffolder", words: /\b(scaffold\w*|stillasbygger|stillas)\b/i },
  { name: "Tiler", words: /\b(tilers?|flisleggere?)\b/i },
  { name: "Roofer", words: /\b(roofers?|taktekkere?)\b/i },
  /**
   * PLASTERBOARD IS CALLED REGIPS HERE, and that word could not be matched.
   *
   * `\b(gipsere?)\b` reads "gipser" and nothing else. It does not read
   * "gipsmontør", which is the job title, and it cannot read "regips" at all:
   * the word boundary is at the start of "regips", not in front of the "gips"
   * inside it, so `\bgips` never fires on the word the trade is actually known
   * by on a Norwegian site. An advert called "Regips / gipsmontør - Oslo"
   * therefore named no trade, and a posting with no trade gets no trade page,
   * no trade-and-town page and no line in the sitemap: nothing on this site
   * answered the search that brought people to it.
   *
   * So: `re` optional in front, and the Norwegian letters after, which covers
   * regips, gips, gipser, gipsmontør, gipsplater, gipsarbeider and regipsing
   * without a list that has to be kept complete. No closing `\b`, because ø is
   * not a word character and a boundary after it does not exist.
   *
   * It stays ONE trade with plastering, under the English name already used by
   * the page and the slug. Splitting it would put the same work on two thin
   * pages competing for the same search.
   */
  { name: "Plasterer", words: /\b(plasterers?|plasterboard|drywall\w*)\b|\b(re)?gips[a-zæøå]*/i },
  { name: "Factory worker", words: /\b(factory workers?|fabrikkarbeidere?|production workers?|produksjonsmedarbeidere?)\b/i },
  { name: "Machine operator", words: /\b(machine operators?|maskinoperat[øo]rer?|cnc)\b/i },
  { name: "Warehouse worker", words: /\b(warehouse|lagermedarbeidere?|lagerarbeidere?)\b/i },
  { name: "Driver", words: /\b(drivers?|sj[åa]f[øo]rer?|truck drivers?|lastebilsj[åa]f[øo]rer?)\b/i },
  { name: "General labourer", words: /\b(hjelpearbeidere?|labourers?|laborers?|general workers?)\b/i },
] as const;

/**
 * The trade named in a title, or null when none of them is.
 *
 * Null is a real answer: a posting whose title names no trade we know gets no
 * trade page, which is better than inventing a category for it and shipping a
 * page with one advert under a name nobody searches for.
 */
export function tradeFromTitle(title: string | null | undefined): string | null {
  const text = String(title ?? "");
  if (!text.trim()) return null;
  for (const trade of TRADES) {
    if (trade.words.test(text)) return trade.name;
  }
  return null;
}
