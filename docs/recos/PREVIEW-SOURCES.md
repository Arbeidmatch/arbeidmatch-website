# Product preview sources

These images are browser captures of the isolated product-preview.html fixture,
not screenshots of authenticated production accounts. All names, conversations,
counts and applications are fictional. No customer or candidate data is used.

Visual references are src/app/globals.css (navy/gold theme tokens),
src/components/layout/Sidebar.tsx (workspace/navigation structure),
src/components/candidates/CandidatesToolbar.tsx and CandidatesTable.tsx,
and src/components/dashboard/DashboardAttentionBand.tsx. This is a simplified
illustrative reconstruction, not an exact reproduction of every product screen.

Regenerate with `node scripts/capture-recos.mjs` while the website runs on port 4175.
Captures are 2400 x 1500 pixels with presentation-only framing from
`scripts/recos-capture.css`: larger text and fewer rows make the 3D screens
readable at a distance. The interactive demo keeps its complete layout.
There are 15 captures: overview, candidates, clients, presentations, pipeline,
messages, assistant and eight team configurations. Client, presentation and
assistant screens illustrate the pre-launch concept; they do not promise an exact
production layout. All examples remain isolated from actual customer records.
Three.js 0.180.0 is vendored with its MIT license. All assets and fonts are local.
