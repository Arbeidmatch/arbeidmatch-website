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
