const fs = require("fs");

const changesPath = ".github/fix-output/changes.json";
if (!fs.existsSync(changesPath)) {
  console.error("No changes.json found");
  process.exit(1);
}

const { changes } = JSON.parse(fs.readFileSync(changesPath, "utf-8"));

for (const change of changes) {
  const filePath = change.file;
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(filePath, "utf-8");

  if (!content.includes(change.oldCode)) {
    console.error(`Old code not found in ${filePath}`);
    continue;
  }

  content = content.replace(change.oldCode, change.newCode);
  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${filePath}`);
}

console.log("All fixes applied");
