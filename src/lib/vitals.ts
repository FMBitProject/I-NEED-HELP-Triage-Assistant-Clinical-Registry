// Pemeriksaan kewajaran nilai input (plausibility check) untuk kualitas data
// registri — HANYA peringatan lunak anti-typo, tidak memblokir dan tidak
// memengaruhi skoring I-NEED-HELP maupun kriteria guideline apa pun.

export interface VitalsInput {
  age?: number | null;
  systolicBp?: number | null;
  diastolicBp?: number | null;
  heartRate?: number | null;
  lvef?: number | null;
  egfr?: number | null;
  ntProbnp?: number | null;
}

export function getVitalsWarnings(v: VitalsInput): string[] {
  const w: string[] = [];
  const has = (x: number | null | undefined): x is number =>
    x !== null && x !== undefined && !Number.isNaN(x) && x !== 0;

  if (has(v.age) && v.age < 18)
    w.push(`Usia ${v.age} tahun — aplikasi ini ditujukan untuk pasien dewasa`);
  if (has(v.age) && v.age > 110)
    w.push(`Usia ${v.age} tahun — periksa kemungkinan salah ketik`);

  if (has(v.systolicBp) && (v.systolicBp < 60 || v.systolicBp > 250))
    w.push(`Sistolik ${v.systolicBp} mmHg di luar rentang wajar (60–250)`);
  if (has(v.diastolicBp) && (v.diastolicBp < 30 || v.diastolicBp > 150))
    w.push(`Diastolik ${v.diastolicBp} mmHg di luar rentang wajar (30–150)`);
  if (has(v.systolicBp) && has(v.diastolicBp) && v.diastolicBp >= v.systolicBp)
    w.push("Diastolik lebih besar/sama dengan sistolik — periksa kembali");

  if (has(v.heartRate) && (v.heartRate < 30 || v.heartRate > 220))
    w.push(`Detak jantung ${v.heartRate} bpm di luar rentang wajar (30–220)`);

  if (has(v.lvef) && (v.lvef < 10 || v.lvef > 75))
    w.push(`LVEF ${v.lvef}% di luar rentang lazim ekokardiografi (10–75)`);

  if (has(v.egfr) && v.egfr > 200)
    w.push(`eGFR ${v.egfr} melebihi nilai fisiologis — periksa satuan/ketikan`);

  if (has(v.ntProbnp) && v.ntProbnp > 35000)
    w.push(
      `NT-proBNP ${v.ntProbnp} pg/mL melebihi batas ukur umum assay (35.000)`
    );

  return w;
}
