# RecOS pre-launch landing

`/recos` serves the immersive English landing as a standalone document through
a Next.js rewrite. This preserves the camera, native scroll and hash navigation
without agency navigation or React layout overlays. Assets stay under
`public/recos-experience/`. The authenticated ATS is separate.

Current beta slots are full. Visitors can join the waitlist as an individual
recruiter, workspace owner or team. Approved benefits: priority beta invitations
when places become available, and the opportunity to contribute product feedback.
No discount, free period, launch date or guaranteed place is promised.

The consent-gated form uses the existing `/api/feature-waitlist` endpoint with
`feature: "RecOS Beta"`. The existing `wants_assistance` field stores the selected
interest, illustrative seat count and consent. No schema or backend change is
required. The form waits for server success; errors retain the email for retry.
The seat selector is a demonstration, not a reservation. The final chapter
summarizes the product and has one action: "Request a beta slot".

Each product scene shows one selected interface, without secondary windows or
duplicate detail screens. The final scene shows a centered signup invitation.
Scroll drives camera travel; larger screens alternate the copy and product sides.
The product tour covers candidates, clients, presentations, pipeline, team seats
and a dedicated AI assistant. AI assistance and human support are described as
available 24/7, as explicitly confirmed by the owner. Assistant examples are
fixed fictional demonstrations; they make no AI calls and create no support tickets.

All product data is fictional. Only the explicit waitlist form sends data.
The demo iframe never connects to the ATS. Its CSP permits framing by this
origin only; other website routes keep their existing framing restrictions.
No third-party scripts, analytics, cookies or remote fonts are introduced.

## Validation

- `npm test`: 350 tests across 47 files passed.
- `npm run build`: local production build.
- `node scripts/verify-recos.mjs`: six desktop, tablet and phone sizes, all five
  chapters, alternating placement, UI interactions, reduced motion, fallback,
  scoped CSP, and mocked signup success/failure/consent checks.
- `node scripts/verify-recos-motion.mjs`: animated camera travel, actual mouse
  scrolling, keyboard navigation, hash sync and motion pause; records video.
- `RECOS_BASE_URL` selects another origin, including production.

Browser signup requests are intercepted with fictional test data. No real
signup is created, no email is sent, and production persistence is not claimed
as tested. Screenshots and recordings are ignored under `.recos-verification/`.

See `PREVIEW-SOURCES.md` for capture provenance and regeneration.
