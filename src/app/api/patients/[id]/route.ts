import { db } from "@/lib/db";
import { auditLogs, patients, outcomes } from "@/lib/db/schema";
import { requireApprovedSession } from "@/lib/api-auth";
import { and, eq } from "drizzle-orm";
import { parseOptionalEnum } from "@/lib/enum-field";
import { CARE_SETTING_LABELS } from "@/lib/care-setting";
import {
  VISIT_DISPOSITION_LABELS,
  isDispositionAllowed,
  readRawDisposition,
} from "@/lib/disposition";
import { HF_ONSET_LABELS } from "@/lib/hf-onset";
import { CONSENT_BASIS_LABELS, MISSING_CONSENT_MESSAGE } from "@/lib/consent";
import { INVALID_INITIAL_MESSAGE, normalizePatientInitial } from "@/lib/patient-initial";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApprovedSession();
  if (error) return error;

  const { id } = await params;

  // ADMIN boleh membaca pasien dokter manapun (read-only, untuk registry);
  // PATCH/DELETE di bawah tetap khusus dokter pemilik.
  const isAdmin = (session.user as { role?: string }).role === "ADMIN";
  const patient = await db.query.patients.findFirst({
    where: isAdmin
      ? eq(patients.id, id)
      : and(eq(patients.id, id), eq(patients.doctorId, session.user.id)),
  });

  if (!patient) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const outcome = await db.query.outcomes.findFirst({
    where: eq(outcomes.patientId, id),
    orderBy: (o, { desc }) => [desc(o.recordedAt)],
  });

  return Response.json({ patient, outcome: outcome ?? null });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApprovedSession();
  if (error) return error;

  const { id } = await params;

  const existing = await db.query.patients.findFirst({
    where: and(eq(patients.id, id), eq(patients.doctorId, session.user.id)),
  });

  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.finalizedAt) {
    const isAdmin = (session.user as { role?: string }).role === "ADMIN";
    if (!isAdmin) {
      return Response.json(
        { error: "Data sudah difinalisasi. Hubungi developer untuk membuka kunci." },
        { status: 423 }
      );
    }
  }

  const body = await req.json();
  const allowedFields = [
    "patientInitial", "age", "gender", "systolicBp", "diastolicBp",
    "heartRate", "lvef", "egfr", "ntProbnp", "comorbidDm", "comorbidHtn",
    "comorbidCkd", "comorbidAf", "onAceArni", "onBb", "onMra", "onSglt2i",
    "noAceArniReason", "noBbReason", "noMraReason", "noSglt2iReason",
    "noAceArniReasonOther", "noBbReasonOther", "noMraReasonOther", "noSglt2iReasonOther",
    "nyhaClass", "hfOnset", "careSetting", "visitDisposition", "consentBasis",
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  // Field enum divalidasi di server (lihat src/lib/enum-field.ts). Nilai
  // disposisi lama (DECEASED_ED) dipetakan ke nilai baru dulu — baris yang
  // belum dimigrasi bisa terbaca form edit lalu dikirim balik apa adanya.
  if ("visitDisposition" in updates) {
    updates.visitDisposition = readRawDisposition({ visitDisposition: updates.visitDisposition });
  }
  const enumFields: [string, Record<string, unknown>][] = [
    ["careSetting", CARE_SETTING_LABELS],
    ["visitDisposition", VISIT_DISPOSITION_LABELS],
    ["hfOnset", HF_ONSET_LABELS],
    ["consentBasis", CONSENT_BASIS_LABELS],
  ];
  for (const [field, labels] of enumFields) {
    if (!(field in updates)) continue;
    const parsed = parseOptionalEnum(field, updates[field], labels);
    if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
    updates[field] = parsed.value;
  }

  // Dasar persetujuan yang sudah tercatat tidak boleh dihapus (bukti
  // kepatuhan UU PDP). Data lama yang masih null boleh dilengkapi.
  if ("consentBasis" in updates && updates.consentBasis === null && existing.consentBasis) {
    return Response.json({ error: MISSING_CONSENT_MESSAGE }, { status: 400 });
  }

  if ("patientInitial" in updates) {
    const initial = normalizePatientInitial(updates.patientInitial);
    if (!initial) return Response.json({ error: INVALID_INITIAL_MESSAGE }, { status: 400 });
    updates.patientInitial = initial;
  }

  // Lokasi perawatan yang sudah tercatat tidak boleh dikosongkan lagi. Null
  // hanya sah untuk data lama era IGD yang memang tidak punya nilainya.
  if ("careSetting" in updates && updates.careSetting === null && existing.careSetting) {
    return Response.json(
      { error: "Lokasi perawatan tidak boleh dikosongkan setelah diisi." },
      { status: 400 }
    );
  }

  // Cek kombinasi memakai nilai EFEKTIF setelah update — PATCH bisa hanya
  // membawa salah satu dari kedua field.
  const effectiveCareSetting =
    "careSetting" in updates ? updates.careSetting : existing.careSetting;
  const effectiveDisposition =
    "visitDisposition" in updates ? updates.visitDisposition : existing.visitDisposition;
  if (!isDispositionAllowed(effectiveCareSetting, effectiveDisposition)) {
    return Response.json(
      {
        error:
          "Pasien yang didaftarkan di rawat inap tidak bisa berdisposisi \"Rawat Inap\" — kosongkan disposisi bila pasien masih dirawat.",
      },
      { status: 400 }
    );
  }

  // Alasan "GDMT tidak diberikan" hanya bermakna bila pilarnya tidak
  // diberikan — bila update menyatakan pilar diberikan, alasannya ikut
  // dikosongkan agar tidak ada data kontradiktif. Teks "Lainnya" ikut
  // aturan yang sama, plus dikosongkan bila alasannya bukan OTHER.
  const gdmtReasonByFlag = {
    onAceArni: "noAceArniReason",
    onBb: "noBbReason",
    onMra: "noMraReason",
    onSglt2i: "noSglt2iReason",
  } as const;
  for (const [flag, reasonField] of Object.entries(gdmtReasonByFlag)) {
    const otherField = `${reasonField}Other`;
    if (updates[flag] === true) {
      updates[reasonField] = null;
      updates[otherField] = null;
    } else if (reasonField in updates && updates[reasonField] !== "OTHER") {
      updates[otherField] = null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(patients)
    .set(updates)
    .where(eq(patients.id, id))
    .returning();

  // Log each changed field to audit trail
  const auditEntries = Object.entries(updates)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter(([field, newVal]) => String((existing as any)[field] ?? "") !== String(newVal ?? ""))
    .map(([field, newVal]) => ({
      patientId: id,
      userId: session.user.id,
      userName: session.user.name,
      action: "update",
      changedField: field,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      oldValue: String((existing as any)[field] ?? ""),
      newValue: String(newVal ?? ""),
    }));

  if (auditEntries.length > 0) {
    await db.insert(auditLogs).values(auditEntries);
  }

  return Response.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApprovedSession();
  if (error) return error;

  const { id } = await params;

  const patient = await db.query.patients.findFirst({
    where: and(eq(patients.id, id), eq(patients.doctorId, session.user.id)),
  });

  if (!patient) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (patient.finalizedAt) {
    const isAdmin = (session.user as { role?: string }).role === "ADMIN";
    if (!isAdmin) {
      return Response.json(
        { error: "Data sudah difinalisasi dan tidak dapat dihapus. Hubungi developer." },
        { status: 423 }
      );
    }
  }

  await db.delete(patients).where(eq(patients.id, id));

  return Response.json({ success: true });
}
