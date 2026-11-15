# Paired screenshots for ORDER 295

The approved mockup (`docs/mockups/site-2026-11-15.html`) beside the site, at 1440 and 390, one folder per stage.
`<name>-mockup-<width>.png` is the mockup, `<name>-site-<width>.png` the site.

Made with `shots.cjs`:

```bash
PW=<path to node_modules/playwright> MOCK=docs/mockups/site-2026-11-15.html \
  node docs/mockups/site-2026-11-15-shots/shots.cjs <base-url> <out-dir> <pairs.json>
```

`pairs.json` lists `{name, route, page, sheet?, open?, open390?}`: `page` and `sheet` are the mockup's own
chip ids (`data-go`, `data-sheet`), `open` the selector that opens the sheet on the site (several joined by `>>>`).

Stage 1 (shell and front page, commit 449bca1): home, sheet-login, sheet-notify, sheet-cookies, sheet-menu (phone only:
on a computer the four entries are in the header).

Stage 2 (For bedrifter, the request sheet, Kontakt as a router, the contact sheet), pairs in `stage-2.json`:
for-bedrifter, contact, sheet-request, sheet-contact. Site-only shots of the sheets in use (no mockup twin):
sheet-request-filled (a firm found in the register, two roles with their own numbers), sheet-request-pay
(the pay and conditions sub-panel), sheet-contact-candidate and sheet-contact-foreign (the other doors of the
contact sheet). Phone lengths at 390: For bedrifter 4.5 screens (11.8 before), Kontakt 2.9.

Stage 3 (For candidates, questions, candidate support, open jobs, the job page, the candidate sheets; commits 548f426,
37037ee, e8b5211), pairs in `stage-3.json`: for-candidates, questions, support, jobs, job, sheet-apply, sheet-alerts,
sheet-register, sheet-message. The message sheet has no chip in the mockup's strip, so `mockOpen` opens it from the
mockup's support page. Phone lengths at 390, header and footer included: For candidates 4.8 screens, questions 3.5,
support 2.2, open jobs 5.2, the job page 6.1 (the advert's own text in both languages is most of it).

Stage 4 (Forsprang at /prosjekter, the invitation sheet; commit c6bd311), pairs in `stage-4.json`: forsprang, sheet-access.
The map, the panel's counts and the list are live data, so they differ from the mockup's fixed numbers by design. The
county panel takes the same per-county figures as the map. Lengths, header and footer included: 4.1 screens at 1440
(the live project list sits in the band), 6.2 at 390. /prosjektvarsler answers 308 to /prosjekter.
