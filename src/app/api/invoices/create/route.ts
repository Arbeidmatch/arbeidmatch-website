import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { safeSendEmail } from "@/lib/email/safeSend";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { generateInvoiceNumber } from "@/lib/invoicing/generateInvoiceNumber";
import { generateInvoicePdf } from "@/lib/invoicing/generateInvoicePdf";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const createInvoiceSchema = z.object({
  employer_email: z.string().trim().email(),
  company_name: z.string().trim().max(200).optional().default(""),
  org_number: z.string().trim().max(60).optional().default(""),
  address: z.string().trim().max(300).optional().default(""),
  stripe_payment_intent_id: z.string().trim().max(200).optional().default(""),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(500),
        quantity: z.number().int().positive().default(1),
        unit_price: z.number().int().nonnegative(),
      }),
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = createInvoiceSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid invoice payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const payload = parsed.data;
    const invoiceNumber = await generateInvoiceNumber();
    const invoiceDate = new Date();
    const dueDate = new Date(invoiceDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const vatRate = 0.25;

    const normalizedItems = payload.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
    }));

    const amountExVat = normalizedItems.reduce((sum, item) => sum + item.total, 0);
    const vatAmount = Math.round(amountExVat * vatRate);
    const amountIncVat = amountExVat + vatAmount;

    const { data: insertedInvoice, error: insertInvoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        employer_email: payload.employer_email.toLowerCase(),
        company_name: payload.company_name || null,
        org_number: payload.org_number || null,
        address: payload.address || null,
        amount_ex_vat: amountExVat,
        vat_amount: vatAmount,
        amount_inc_vat: amountIncVat,
        vat_rate: vatRate,
        due_date: dueDate.toISOString().slice(0, 10),
        items: normalizedItems,
        stripe_payment_intent_id: payload.stripe_payment_intent_id || null,
        status: "pending",
      })
      .select("id")
      .maybeSingle();

    if (insertInvoiceError || !insertedInvoice?.id) {
      return NextResponse.json({ error: insertInvoiceError?.message || "Could not create invoice." }, { status: 500 });
    }

    const invoiceId = insertedInvoice.id;

    const itemRows = normalizedItems.map((item) => ({
      invoice_id: invoiceId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    }));
    const { error: insertItemsError } = await supabase.from("invoice_items").insert(itemRows);
    if (insertItemsError) {
      return NextResponse.json({ error: insertItemsError.message }, { status: 500 });
    }

    const pdfBuffer = await generateInvoicePdf({
      invoiceNumber,
      invoiceDate,
      dueDate,
      companyName: payload.company_name || null,
      orgNumber: payload.org_number || null,
      address: payload.address || null,
      items: normalizedItems,
      amountExVat,
      vatAmount,
      amountIncVat,
      vatRate,
      currency: "NOK",
    });

    const pdfPath = `${payload.employer_email.toLowerCase()}/${invoiceNumber}.pdf`;
    const { error: uploadError } = await supabase.storage.from("invoices").upload(pdfPath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from("invoices").getPublicUrl(pdfPath);
    const pdfUrl = publicUrlData.publicUrl;

    await supabase.from("invoices").update({ pdf_path: pdfPath, pdf_url: pdfUrl }).eq("id", invoiceId);

    const emailSubject = `Faktura ${invoiceNumber} – ArbeidMatch Norge AS`;
    const emailHtml = `
      <p>Hei,</p>
      <p>Vedlagt finner du faktura <strong>${invoiceNumber}</strong>.</p>
      <p>Forfallsdato: ${dueDate.toISOString().slice(0, 10)}</p>
      <p>Beløp inkl MVA: ${(amountIncVat / 100).toFixed(2)} NOK</p>
      <p>Med vennlig hilsen,<br/>ArbeidMatch Norge AS</p>
    `;

    await safeSendEmail(payload.employer_email, emailSubject, emailHtml, {
      ...mailHeaders(),
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      pdf_url: pdfUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error while creating invoice." },
      { status: 500 },
    );
  }
}
