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
