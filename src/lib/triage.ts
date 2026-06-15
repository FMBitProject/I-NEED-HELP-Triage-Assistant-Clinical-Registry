import { TriageCriteria } from "./types";

export const TRIAGE_CRITERIA_LABELS: Record<
  keyof TriageCriteria,
  { label: string; key: string; description: string }
> = {
  I: {
    key: "I",
    label: "Inotropik IV",
    description:
      "Pasien membutuhkan inotropik intravena untuk mempertahankan sirkulasi.",
  },
  N: {
    key: "N",
    label: "NYHA / Natriuretic Peptide",
    description:
      "NYHA kelas IIIB/IV atau peningkatan persisten Natriuretic Peptide (NT-proBNP tinggi).",
  },
  E1: {
    key: "E",
    label: "End-Organ Dysfunction",
    description:
      "Terdapat disfungsi organ akhir (gagal ginjal, gangguan hepar, atau gangguan perfusi jaringan).",
  },
  E2: {
    key: "E",
    label: "EF Rendah (LVEF < 35%)",
    description:
      "Fraksi ejeksi ventrikel kiri (LVEF) kurang dari 35% berdasarkan ekokardiografi.",
  },
  D: {
    key: "D",
    label: "Defibrilator Shock",
    description:
      "Riwayat menerima kejut defibrilator (ICD shock) yang sesuai maupun tidak sesuai.",
  },
  H: {
    key: "H",
    label: "Hospitalisasi Berulang",
    description:
      "Riwayat rawat inap karena gagal jantung lebih dari 1 kali dalam 12 bulan terakhir.",
  },
  E3: {
    key: "E",
    label: "Edema Persisten",
    description:
      "Edema persisten meskipun dosis diuretik telah ditingkatkan secara optimal.",
  },
  L: {
    key: "L",
    label: "Low BP & High HR",
    description:
      "Tekanan darah rendah (hipotensi) disertai detak jantung yang tinggi (takikardia).",
  },
  P: {
    key: "P",
    label: "Progresi / Intolerasi GDMT",
    description:
      "Intoleransi progresif atau kebutuhan penurunan dosis GDMT (obat lini pertama gagal jantung).",
  },
};

export function calculateTriageScore(criteria: TriageCriteria): number {
  return Object.values(criteria).filter(Boolean).length;
}

export function getRecommendation(
  score: number
): "REFER" | "CONTINUE_GDMT" {
  return score >= 1 ? "REFER" : "CONTINUE_GDMT";
}

export function getTriageResult(criteria: TriageCriteria) {
  const score = calculateTriageScore(criteria);
  const recommendation = getRecommendation(score);
  const metCriteria = (
    Object.entries(criteria) as [keyof TriageCriteria, boolean][]
  )
    .filter(([, v]) => v)
    .map(([k]) => TRIAGE_CRITERIA_LABELS[k].label);

  return {
    score,
    recommendation,
    metCriteria,
    isUrgent: recommendation === "REFER",
  };
}

export function countGdmt(patient: {
  onAceArni: boolean;
  onBb: boolean;
  onMra: boolean;
  onSglt2i: boolean;
}): number {
  return [patient.onAceArni, patient.onBb, patient.onMra, patient.onSglt2i].filter(
    Boolean
  ).length;
}
