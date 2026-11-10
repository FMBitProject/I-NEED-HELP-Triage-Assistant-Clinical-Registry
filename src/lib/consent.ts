import type { ConsentBasis } from "./types";

// Dasar hukum pemrosesan data pasien (UU PDP No. 27/2022). Data kesehatan
// termasuk "data pribadi yang bersifat spesifik", dan data pseudoanonim
// (inisial + usia + data klinis) tetap dihitung data pribadi — jadi setiap
// pasien yang masuk registri harus punya dasar pemrosesan yang tercatat.
export const CONSENT_BASIS_LABELS: Record<
  ConsentBasis,
  { label: string; icon: string; desc: string }
> = {
  INFORMED_CONSENT: {
    label: "Informed Consent Pasien",
    icon: "✍️",
    desc: "Pasien/wali sudah menyetujui datanya dipakai untuk registri penelitian",
  },
  ETHICS_WAIVER: {
    label: "Waiver Komite Etik",
    icon: "📜",
    desc: "Komite etik membebaskan kewajiban informed consent untuk studi ini",
  },
};

export const CONSENT_BASIS_OPTIONS = Object.entries(CONSENT_BASIS_LABELS).map(
  ([value, meta]) => ({ value: value as ConsentBasis, ...meta })
);

export const MISSING_CONSENT_MESSAGE =
  "Dasar persetujuan pasien wajib dipilih (informed consent atau waiver komite etik) — data pasien tidak boleh disimpan tanpa dasar hukum (UU PDP).";
