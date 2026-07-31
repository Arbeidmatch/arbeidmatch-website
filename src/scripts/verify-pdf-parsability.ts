import { TEMPLATE_IDS } from "@/lib/cv/schema";
import { checkTemplateParsability } from "@/lib/cv/parsability";

/**
 * Build gate: renders every CV template with the demo fixture and asserts the text a
 * parser extracts is complete and in the right order. Run with `npm run cv:verify-pdf`.
 */
async function main() {
  let failed = false;

  for (const templateId of TEMPLATE_IDS) {
    const result = await checkTemplateParsability(templateId);
    if (result.failures.length === 0) {
      process.stdout.write(`PASS  ${templateId}  (${result.pageCount} page(s))\n`);
      continue;
    }
    failed = true;
    process.stdout.write(`FAIL  ${templateId}\n`);
    for (const failure of result.failures) process.stdout.write(`        ${failure}\n`);
  }

  if (failed) {
    process.stdout.write("\nAt least one template is not parseable. Do not ship it.\n");
    process.exitCode = 1;
    return;
  }
  process.stdout.write("\nAll templates are parseable.\n");
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
