import { db } from "@/lib/db";
import { outcomes, patients } from "@/lib/db/schema";
import { requireApprovedSession } from "@/lib/api-auth";
import { and, desc, eq, inArray } from "drizzle-orm";
import { parseOptionalEnum } from "@/lib/enum-field";
import { CARE_SETTING_LABELS } from "@/lib/care-setting";
import {
  VISIT_DISPOSITION_LABELS,
  isDispositionAllowed,
  readRawDisposition,
} from "@/lib/disposition";
import { HF_ONSET_LABELS } from "@/lib/hf-onset";

export async function GET() {
  const { session, error } = await requireApprovedSession();
  if (error) return error;

  const patientsList = await db
    .select()
    .from(patients)
    .where(eq(patients.doctorId, session.user.id))
    .orderBy(desc(patients.createdAt));

  if (patientsList.length === 0) return Response.json([]);

  const patientIds = patientsList.map((p) => p.id);

  const allOutcomes = await db
    .select()
    .from(outcomes)
    .where(inArray(outcomes.patientId, patientIds));

  const enriched = patientsList.map((p) => ({
    ...p,
    egfr: p.egfr != null ? parseFloat(p.egfr) : null,
    outcome:
      allOutcomes
        .filter((o) => o.patientId === p.id)
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0] ??
      null,
  }));

  return Response.json(enriched);
}

export async function POST(request: Request) {
  const { session, error } = await requireApprovedSession();
  if (error) return error;

  const body = await request.json();

  // Kriteria inklusi registri: pasien baru wajib punya NT-proBNP. Dicek lagi
  // di sini (bukan cuma di form) supaya entri offline-queue lama yang antre
  // dari sebelum field ini diwajibkan tidak lolos diam-diam saat disinkron.
  if (!(typeof body.ntProbnp === "number" && body.ntProbnp > 0)) {
    return Response.json(
      { error: "NT-proBNP wajib diisi untuk pendaftaran pasien baru" },
      { status: 400 }
    );
  }

  // Field enum divalidasi di server: nilai sembarang ditolak dengan pesan
  // yang menyebut field-nya (muncul sebagai alasan penolakan di antrean
  // offline), bukan disimpan diam-diam lalu disembunyikan UI.
  //
  // Disposisi dibaca juga dari nama field lama `edDisposition` (+ nilai lama
  // DECEASED_ED → DECEASED): entri antrean offline yang tersimpan sebelum
  // rename masih mengirim nama itu, dan mengabaikannya berarti disposisi yang
  // sudah diisi dokter hilang tanpa error.
  const careSettingParsed = parseOptionalEnum("careSetting", body.careSetting, CARE_SETTING_LABELS);
  const dispositionParsed = parseOptionalEnum(
    "visitDisposition",
    readRawDisposition(body),
    VISIT_DISPOSITION_LABELS
  );
  const hfOnsetParsed = parseOptionalEnum("hfOnset", body.hfOnset, HF_ONSET_LABELS);
  for (const parsed of [careSettingParsed, dispositionParsed, hfOnsetParsed]) {
    if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
  }
  const careSetting = careSettingParsed.ok ? careSettingParsed.value : null;
  const visitDisposition = dispositionParsed.ok ? dispositionParsed.value : null;
  const hfOnset = hfOnsetParsed.ok ? hfOnsetParsed.value : null;

  if (!isDispositionAllowed(careSetting, visitDisposition)) {
    return Response.json(
      {
        error:
          "Pasien yang didaftarkan di rawat inap tidak bisa berdisposisi \"Rawat Inap\" — kosongkan disposisi bila pasien masih dirawat.",
      },
      { status: 400 }
    );
  }

  const clientRequestId =
    typeof body.clientRequestId === "string" && body.clientRequestId
      ? body.clientRequestId
      : null;

  const [patient] = await db
    .insert(patients)
    .values({
      doctorId: session.user.id,
      clientRequestId,
      patientInitial: body.patientInitial,
      age: body.age,
      gender: body.gender,
      systolicBp: body.systolicBp,
      diastolicBp: body.diastolicBp,
      heartRate: body.heartRate,
      lvef: body.lvef ?? null,
      egfr: body.egfr ?? null,
      ntProbnp: body.ntProbnp ?? null,
      comorbidDm: body.comorbidDm ?? false,
      comorbidHtn: body.comorbidHtn ?? false,
      comorbidCkd: body.comorbidCkd ?? false,
      comorbidAf: body.comorbidAf ?? false,
      onAceArni: body.onAceArni ?? false,
      onBb: body.onBb ?? false,
      onMra: body.onMra ?? false,
      onSglt2i: body.onSglt2i ?? false,
      // Alasan hanya bermakna bila pilarnya tidak diberikan — cegah data
      // kontradiktif walau klien mengirim keduanya. Teks "Lainnya" hanya
      // ikut tersimpan bila alasannya OTHER.
      noAceArniReason: body.onAceArni ? null : body.noAceArniReason ?? null,
      noBbReason: body.onBb ? null : body.noBbReason ?? null,
      noMraReason: body.onMra ? null : body.noMraReason ?? null,
      noSglt2iReason: body.onSglt2i ? null : body.noSglt2iReason ?? null,
      noAceArniReasonOther:
        !body.onAceArni && body.noAceArniReason === "OTHER"
          ? body.noAceArniReasonOther ?? null
          : null,
      noBbReasonOther:
        !body.onBb && body.noBbReason === "OTHER"
          ? body.noBbReasonOther ?? null
          : null,
      noMraReasonOther:
        !body.onMra && body.noMraReason === "OTHER"
          ? body.noMraReasonOther ?? null
          : null,
      noSglt2iReasonOther:
        !body.onSglt2i && body.noSglt2iReason === "OTHER"
          ? body.noSglt2iReasonOther ?? null
          : null,
      nyhaClass: body.nyhaClass ?? null,
      hfOnset,
      // careSetting wajib dipilih di form, tapi TIDAK diwajibkan di sini: entri
      // offline-queue yang antre dari sebelum field ini ada tidak punya
      // nilainya, dan menolaknya berarti membuang data klinis asli. Null di
      // sini berarti "entri lama", bukan "dokter lupa mengisi".
      careSetting,
      visitDisposition,
    })
    .onConflictDoNothing({ target: patients.clientRequestId })
    .returning();

  // Tidak ada baris kembali = clientRequestId sudah pernah dipakai, artinya
  // kiriman ini duplikat (respons sebelumnya hilang di jalan). Kembalikan
  // pasien yang sudah tersimpan supaya klien menganggapnya sukses dan
  // mengosongkan antrean, bukan menumpuk pasien dobel.
  if (!patient) {
    const existing = clientRequestId
      ? await db.query.patients.findFirst({
          where: and(
            eq(patients.clientRequestId, clientRequestId),
            eq(patients.doctorId, session.user.id)
          ),
        })
      : undefined;

    if (!existing) {
      return Response.json(
        { error: "Gagal menyimpan data pasien" },
        { status: 409 }
      );
    }
    return Response.json(
      { ...existing, egfr: existing.egfr != null ? parseFloat(existing.egfr) : null },
      { status: 200 }
    );
  }

  return Response.json({ ...patient, egfr: patient.egfr != null ? parseFloat(patient.egfr) : null }, { status: 201 });
}
