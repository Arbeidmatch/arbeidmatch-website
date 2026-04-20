import clipboardy from "clipboardy";

const errorText = process.argv[2];

if (!errorText) {
  console.log('Usage: npx ts-node src/scripts/parse-error-email.ts "error text"');
  process.exit(1);
}

const prompt = `
Find the error in the codebase:
${errorText}

1. Identify the exact file and line
2. Find root cause
3. Apply minimal fix
4. Run npm run build
5. Fix all TypeScript errors
6. git add . && git commit -m "fix: [describe fix]" && git push origin main

Report in Romanian with da/nu table.
`.trim();

clipboardy.writeSync(prompt);
console.log("Prompt copied to clipboard. Paste in Cursor.");
