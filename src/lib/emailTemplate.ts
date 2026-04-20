export function buildEmail(options: {
  title: string;
  preheader?: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const { title, preheader, body, ctaText, ctaUrl, footerNote } = options;
  const ctaHtml =
    ctaText && ctaUrl
      ? `<a href="${ctaUrl}" style="display:block;margin:32px auto 0;max-width:200px;background:#C9A84C;color:#0D1B2A;font-weight:700;font-size:14px;padding:14px 32px;border-radius:8px;text-decoration:none;text-align:center;">${ctaText}</a>`
      : "";
  const footerNoteHtml = footerNote
    ? `<div style="color:rgba(255,255,255,0.2);font-size:12px;margin-top:8px;">${footerNote}</div>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#0D1B2A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#0D1B2A;">
      <div style="background:#0D1B2A;padding:24px 40px 20px;">
        <div style="font-size:22px;font-weight:700;line-height:1.2;">
          <span style="color:#ffffff;">Arbeid</span><span style="color:#C9A84C;">Match</span>
        </div>
        <div style="width:40px;height:2px;background:#C9A84C;margin-top:8px;"></div>
      </div>
      <div style="background:#111e2e;border:1px solid rgba(201,168,76,0.15);border-radius:12px;padding:40px;">
        <div style="color:#ffffff;font-size:24px;font-weight:700;margin-bottom:8px;">${title}</div>
        ${
          preheader
            ? `<div style="color:#C9A84C;font-size:13px;margin-bottom:32px;">${preheader}</div>`
            : ""
        }
        <div style="color:#ffffff;font-size:15px;line-height:1.7;">${body}</div>
        ${ctaHtml}
      </div>
      <div style="background:#0D1B2A;padding:24px 40px;border-top:1px solid rgba(201,168,76,0.1);margin-top:20px;">
        <div style="color:rgba(255,255,255,0.35);font-size:12px;line-height:1.7;">
          <div>ArbeidMatch Norge AS | Org.nr 935 667 089 MVA</div>
          <div>Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway</div>
          <div>post@arbeidmatch.no | arbeidmatch.no</div>
          ${footerNoteHtml}
        </div>
      </div>
    </div>
  </body>
</html>`;
}
