const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] : "";
};

const issueTitle = getArg("--issue-title");
const issueBody = getArg("--issue-body");
const issueNumber = getArg("--issue-number");

async function generateFix() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY not set");
    process.exit(1);
  }

  const routeMatch = issueTitle.match(/\/api\/[^\s:]+/);
  const route = routeMatch ? routeMatch[0] : "";

  let relevantCode = "";
  if (route) {
    const filePath = `src/app${route}/route.ts`;
    if (fs.existsSync(filePath)) {
      relevantCode = fs.readFileSync(filePath, "utf-8");
    }
  }

  const prompt = `You are a senior Next.js developer fixing a production error on arbeidmatch.no.

ISSUE TITLE: ${issueTitle}
ISSUE NUMBER: ${issueNumber}

ISSUE BODY:
${issueBody}

RELEVANT CODE:
${relevantCode}

RULES:
- Fix ONLY the specific error described
- Minimal changes
- No console.log
- TypeScript strict
- Return JSON with exact file changes

Return ONLY this JSON format, nothing else:
{
  "canFix": true or false,
  "reason": "why you can or cannot fix this",
  "changes": [
    {
      "file": "src/app/api/example/route.ts",
      "oldCode": "exact code to replace",
      "newCode": "replacement code"
    }
  ]
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || "";

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error("Claude did not return valid JSON");
    process.exit(0);
  }

  if (!parsed.canFix) {
    console.log("Claude cannot fix this automatically:", parsed.reason);
    process.exit(0);
  }

  const outputDir = ".github/fix-output";
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "changes.json"), JSON.stringify(parsed, null, 2));

  console.log("Fix generated successfully");
}

generateFix().catch((error) => {
  console.error(error);
  process.exit(1);
});
