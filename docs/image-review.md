# Photograph review - 2026-09-13

Reviewer: GPT-6. Trigger: the owner identified a third arm in the homepage hero.
The previous UI review missed the anatomical defect. Build and browser checks
alone were insufficient.

## Rejected and removed

- `carpenter-2-workwear-v2.png`: three arm/hand paths around the drill and timber.
  The grey sleeve behind the drill is additional to the drill-holding forearm
  and the arm whose glove braces the timber. Do not reuse.
- Removed website derivative `public/images/home/tradesperson.webp`:
  SHA256 `b816b4c7e710746ebecbc2dbc6b2d7a68813208b4a55088f32c0af98ebb0f32d`.
- Source-library asset `f40ab786-1f20-4ec3-95d0-97d53af19af4` archived and no
  longer default; the saved status was read back and verified.

## Replacement

- `public/images/home/carpenter-reviewed.webp`, derived from the existing
  `carpenter-1-workwear-v2.png`, with no new image generation.
- SHA256 `c07e0cecf591ea9bbf41c5aee73e797d89f33622a93d7b05143bf691d230299a`.
- One carpenter marking timber with a pencil and square. Two visible arms:
  near arm holds the pencil, far arm holds the square. No additional limb
  observed. Clothing carries ArbeidMatch branding; domain is legible.

## Scope inspected

The twelve workwear-v2 source images were opened individually at source size:
carpenter 1/2, concrete-worker 1/2, electrician 1/2, mechanic 1/2, painter 1/2,
roofer 1/2. Other than carpenter 2, no obvious extra limb was found. Occluded
fingers cannot be verified as if they were visible, and this is not a technical
certification of the depicted work or equipment.

All seven current public job-card images were downloaded and inspected. The
painter endpoint returned a logo; its homepage fallback photograph and the
concrete fallback were reviewed in the source set above. The other job images
showed no obvious extra limbs. The legacy team hero was also inspected: no
obvious additional limb found; it is not the current homepage hero.

All 59 distinct portfolio photographs referenced by the tiling department and
its gallery were downloaded and visually screened in indexed review sheets.
They primarily depict interiors, stairs and finished surfaces. No obvious
generated anatomical defect was found. This screen does not verify authorship
or certify construction quality.

## Additional issue found

The six square-glyph watermarks were fixed by ATS commit eb35b08ef with
font-independent outlines, then visually verified in production. Some older
job photographs still lack the newer clothing branding; do not describe the
full collection as defect-free.

## Footer removal and consistent photographs

Owner correction: no footer band in advert photographs. The replacement
`public/images/home/carpenter-watermarked.webp` uses the built-in image editor
to remove the original footer, then adds small corner watermarks in the image
renderer. The older carpenter's pencil hand and square hand were inspected
again; two arms, no additional limb, unchanged clothing logo.

Eleven library photographs were edited and inspected individually: carpenter-1,
mechanic-1/2, concrete-worker-1/2, electrician-1/2, painter-1/2, roofer-1/2.
No obvious extra limbs or new identifiable third-party branding were observed.
The rejected carpenter-2 remains excluded. Prompts and exact source/output paths
are recorded in the local footerless manifest under the role-campaign artifacts.

Cards, detail pages, structured data and social metadata now use the same
image resolver. Detail pages preserve the whole image with object-contain.

## Evidence

Original public responses, portfolio URL index, five contact sheets, and the
library quarantine record are stored locally under
`C:/Cursor test/ats-worktrees/codex-artifacts/photo-audit/`.
Future additions must be inspected individually before deployment, not approved
from a thumbnail or a generated-image prompt alone.
