import clipboardy from "clipboardy";

const errorText = process.argv[2];

if (!errorText) {
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
