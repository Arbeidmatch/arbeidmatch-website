import { NextRequest, NextResponse } from "next/server";
import { notifyError } from "@/lib/errorNotifier";
import { manualJobUpdateSchema, mapManualInputToJobPayload } from "@/lib/jobs/admin-schema";
import { archiveJob, getJobById, publishJob, updateManualJob } from "@/lib/jobs/repository";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const job = await getJobById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ job });
  } catch (error) {
    await notifyError({ route: "/api/jobs/[id] GET", error });
    return NextResponse.json({ error: "Failed to read job" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const current = await getJobById(id);
    if (!current) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const parsed = manualJobUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }
    const merged = {
      title: parsed.data.title ?? current.title,
      companyName: parsed.data.companyName ?? current.companyName ?? "",
      hideCompany: parsed.data.hideCompany ?? current.hideCompany ?? false,
      location: parsed.data.location ?? current.location,
      category: parsed.data.category ?? current.category ?? "",
      trade: parsed.data.trade ?? current.trade ?? "",
      contractType: parsed.data.contractType ?? current.contractType ?? "",
      workModel: (parsed.data.workModel ?? current.workModel ?? "Recruitment") as "Recruitment" | "Bemanning" | "Permanent",
      languageRequirement: parsed.data.languageRequirement ?? current.languageRequirement ?? "",
      salary: parsed.data.salary ?? current.salary ?? "",
      summary: parsed.data.summary ?? current.summary ?? "",
      description: parsed.data.description ?? current.description,
      responsibilities:
        parsed.data.responsibilities ??
        (Array.isArray(current.responsibilities) ? current.responsibilities.join("\n") : (current.responsibilities ?? "")),
      requirements:
        parsed.data.requirements ??
        (Array.isArray(current.requirements) ? current.requirements.join("\n") : (current.requirements ?? "")),
      benefits: parsed.data.benefits ?? (Array.isArray(current.benefits) ? current.benefits.join("\n") : (current.benefits ?? "")),
      startDate: parsed.data.startDate ?? current.startDate ?? "",
      applicationMethod: parsed.data.applicationMethod ?? current.applicationMethod ?? "internal",
      applicationUrl: parsed.data.applicationUrl ?? current.applicationUrl ?? "",
      applicationEmail: parsed.data.applicationEmail ?? current.applicationEmail ?? "",
      status: parsed.data.status ?? current.status,
      featured: parsed.data.featured ?? current.featured ?? false,
      expiryDate: parsed.data.expiryDate ?? current.expiryDate ?? "",
    };
    const mapped = mapManualInputToJobPayload(merged);
    const job = await updateManualJob(id, mapped);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ job });
  } catch (error) {
    await notifyError({ route: "/api/jobs/[id] PUT", error });
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { action?: string };
    const job = body.action === "archive" ? await archiveJob(id) : await publishJob(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    await notifyError({ route: "/api/jobs/[id] PATCH", error });
    return NextResponse.json({ error: "Failed to change publish state" }, { status: 500 });
  }
}

export async function DELETE() {
  return NextResponse.json({ error: "Delete is not supported. Use archive." }, { status: 405 });
}
