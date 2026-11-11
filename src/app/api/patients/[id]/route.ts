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
import { checkPatientInitial } from "@/lib/patient-initial";
import { INVALID_BODY_RESPONSE, readJsonObject } from "@/lib/request-helpers";
import { ACCESS_LOG_FAILED_MESSAGE, recordAccess } from "@/lib/access-log";

/** Field yang nilainya tidak boleh tersalin ke audit trail (bisa berisi identitas). */
const REDACTED_AUDIT_FIELDS = new Set(["patientInitial"]);
const REDACTED_AUDIT_VALUE = "[disamarkan]";

function auditValue(field: string, value: unknown): string {
  if (REDACTED_AUDIT_FIELDS.has(field)) return REDACTED_AUDIT_VALUE;
  return String(value ?? "");
}

export async function GET(
  req: Request,
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

  // Admin membuka pasien milik dokter lain = akses lintas dokter → dicatat.
  if (isAdmin && patient.doctorId !== session.user.id) {
    try {
      await recordAccess(req, session.user, "admin_view_patient", {
        patientId: id,
        ownerDoctorId: patient.doctorId,
      });
    } catch (err) {
      console.error("[patients/get] gagal mencatat access_log", err);
      return Response.json({ error: ACCESS_LOG_FAILED_MESSAGE }, { status: 503 });
    }
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

  const body = await readJsonObject(req);
  if (!body) return INVALID_BODY_RESPONSE();
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
    if (updates.patientInitial === existing.patientInitial) {
      // Tidak berubah (form edit selalu mengirim ulang inisial). Data lama
      // bisa berisi inisial yang kini ditolak aturan "mirip nama" — jangan
      // blokir edit field lain gara-gara nilai yang tidak disentuh.
      delete updates.patientInitial;
    } else {
      const initial = checkPatientInitial(updates.patientInitial);
      if (!initial.ok) return Response.json({ error: initial.error }, { status: 400 });
      updates.patientInitial = initial.value;
    }
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

  // Log each changed field to audit trail. Field identitas disamarkan: kalau
  // data lama berisi nama lengkap lalu dikoreksi jadi inisial, nama itu tidak
  // boleh tetap tersimpan di old_value (koreksinya jadi percuma).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oldOf = (field: string) => (existing as any)[field];
  const auditEntries = Object.entries(updates)
    .filter(([field, newVal]) => String(oldOf(field) ?? "") !== String(newVal ?? ""))
    .map(([field, newVal]) => ({
      patientId: id,
      userId: session.user.id,
      userName: session.user.name,
      action: "update",
      changedField: field,
      oldValue: auditValue(field, oldOf(field)),
      newValue: auditValue(field, newVal),
    }));

  if (auditEntries.length > 0) {
    await db.insert(auditLogs).values(auditEntries);
  }

  return Response.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApprovedSession();
  if (error) return error;

  const { id } = await params;

  // ADMIN boleh menghapus pasien dokter manapun — jalur hak hapus (UU PDP)
  // untuk data yang sudah difinalisasi. Sebelumnya query ini selalu memfilter
  // doctorId = admin sendiri, sehingga cabang "isAdmin" di bawah tidak pernah
  // tercapai untuk pasien milik dokter lain.
  const isAdmin = (session.user as { role?: string }).role === "ADMIN";
  const patient = await db.query.patients.findFirst({
    where: isAdmin
      ? eq(patients.id, id)
      : and(eq(patients.id, id), eq(patients.doctorId, session.user.id)),
  });

  if (!patient) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (patient.finalizedAt && !isAdmin) {
    return Response.json(
      { error: "Data sudah difinalisasi dan tidak dapat dihapus. Minta admin untuk menghapusnya." },
      { status: 423 }
    );
  }

  // audit_logs pasien ikut terhapus (cascade), jadi jejak penghapusan dicatat
  // di access_logs — tanpa data klinis, hanya ID. Gagal catat = batal hapus.
  try {
    await recordAccess(req, session.user, "delete_patient", {
      patientId: id,
      ownerDoctorId: patient.doctorId,
      finalized: !!patient.finalizedAt,
    });
  } catch (err) {
    console.error("[patients/delete] gagal mencatat access_log", err);
    return Response.json({ error: ACCESS_LOG_FAILED_MESSAGE }, { status: 503 });
  }

  await db.delete(patients).where(eq(patients.id, id));

  return Response.json({ success: true });
}
