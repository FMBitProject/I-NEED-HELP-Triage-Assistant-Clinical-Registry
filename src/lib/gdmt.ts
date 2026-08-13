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
