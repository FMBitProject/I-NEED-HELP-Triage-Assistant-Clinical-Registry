"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Inbox } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConsentBasisField } from "@/components/consent-basis-field";
import { isEnumValue } from "@/lib/enum-field";
import { CONSENT_BASIS_LABELS, MISSING_CONSENT_MESSAGE } from "@/lib/consent";
import { checkPatientInitial, MAX_INITIAL_INPUT_LENGTH } from "@/lib/patient-initial";
import type { ConsentBasis } from "@/lib/types";
import {
  PendingPatient,
  QUEUE_CHANGED_EVENT,
  discardPendingPatient,
  isHeldForReview,
  listPendingPatientsFor,
  resolvePendingPatient,
  syncPendingPatients,
} from "@/lib/offline-queue";

// Halaman penyelesaian antrean offline. Entri yang ditolak server karena
// isinya (mis. belum ada dasar persetujuan — wajib sejak aturan UU PDP) atau
// entri lama tanpa pemilik tidak akan pernah terkirim sendiri; di sini dokter
// bisa melihat isinya, melengkapinya, atau membuangnya.
export default function OfflineQueuePage() {
  const { doctor, isLoading } = useAuth();
  const router = useRouter();
  const userId = doctor?.id ?? null;
  const [entries, setEntries] = useState<PendingPatient[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !doctor) router.replace("/login");
  }, [doctor, isLoading, router]);

  const reload = useCallback(async () => {
    if (!userId) return;
    try {
      setEntries(await listPendingPatientsFor(userId));
      setLoadError(null);
    } catch (err) {
      console.error("[offline-queue] gagal membaca antrean", err);
      setLoadError("Antrean di perangkat ini tidak bisa dibaca (penyimpanan browser diblokir?).");
    }
  }, [userId]);

  useEffect(() => {
    const t = setTimeout(reload, 0);
    window.addEventListener(QUEUE_CHANGED_EVENT, reload);
    return () => {
      clearTimeout(t);
      window.removeEventListener(QUEUE_CHANGED_EVENT, reload);
    };
  }, [reload]);

  if (isLoading || !doctor) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-14">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Antrean Offline</h1>
            <p className="text-xs text-gray-500 mt-1">
              Pasien yang didaftarkan saat tidak ada sinyal dan belum tersimpan di server.
              Hanya entri milik akun Anda (dan entri lama tanpa pemilik) yang tampil.
            </p>
          </div>

          {loadError && (
            <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {loadError}
            </p>
          )}

          {entries && entries.length === 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center space-y-2">
                <Inbox className="w-6 h-6 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-600">Tidak ada pasien yang menunggu di perangkat ini.</p>
              </CardContent>
            </Card>
          )}

          {entries?.map((e) => (
            <QueueEntryCard key={e.queueId} entry={e} userId={doctor.id} />
          ))}
        </div>
      </main>
    </div>
  );
}

function QueueEntryCard({ entry, userId }: { entry: PendingPatient; userId: string }) {
  const p = entry.patient;
  const unowned = entry.ownerId === undefined;
  const held = isHeldForReview(entry);
  const consentMissing = !isEnumValue(CONSENT_BASIS_LABELS, p.consentBasis);
  const initialInvalid = !checkPatientInitial(p.patientInitial).ok;

  const [consent, setConsent] = useState<"" | ConsentBasis>(
    isEnumValue(CONSENT_BASIS_LABELS, p.consentBasis) ? p.consentBasis : ""
  );
  const [initial, setInitial] = useState(initialInvalid ? "" : p.patientInitial);
  const [claimConfirmed, setClaimConfirmed] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (unowned && !claimConfirmed) {
      setError("Centang konfirmasi bahwa Anda yang mendaftarkan pasien ini.");
      return;
    }
    if (!consent) {
      setError(MISSING_CONSENT_MESSAGE);
      return;
    }
    const initialCheck = checkPatientInitial(initial);
    if (!initialCheck.ok) {
      setError(initialCheck.error);
      return;
    }
    setBusy(true);
    try {
      await resolvePendingPatient(entry.queueId, userId, {
        consentBasis: consent,
        patientInitial: initialCheck.value,
      });
      if (navigator.onLine) {
        const result = await syncPendingPatients(userId);
        if (result.needsLogin) setError("Sesi berakhir — login ulang agar data terkirim.");
        // Bila ditolak lagi, entri tetap tampil dengan alasan barunya.
      }
    } catch (err) {
      console.error("[offline-queue] gagal menyimpan perbaikan", err);
      setError(err instanceof Error ? err.message : "Gagal menyimpan perubahan.");
    } finally {
      setBusy(false);
    }
  };

  const discard = async () => {
    setBusy(true);
    try {
      await discardPendingPatient(entry.queueId, userId);
    } catch (err) {
      console.error("[offline-queue] gagal membuang entri", err);
      setError(err instanceof Error ? err.message : "Gagal membuang entri.");
      setBusy(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {p.patientInitial || "—"} · {p.age} th · {p.gender === "M" ? "L" : "P"}
            </p>
            <p className="text-[11px] text-gray-500">
              Diisi {new Date(entry.createdAt).toLocaleString("id-ID")}
            </p>
          </div>
          <span
            className={
              held || unowned
                ? "text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded"
                : "text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded"
            }
          >
            {unowned ? "Belum diklaim" : held ? "Ditolak server" : "Menunggu sinyal"}
          </span>
        </div>

        {entry.lastError && (
          <p className="text-xs text-red-700 flex gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Alasan penolakan terakhir: {entry.lastError}</span>
          </p>
        )}

        {(held || unowned) && (
          <>
            {unowned && (
              <label className="flex items-start gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={claimConfirmed}
                  onChange={(e) => setClaimConfirmed(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Entri ini dibuat sebelum antrean mencatat pemiliknya. Saya yang
                  mendaftarkan pasien ini dan ia akan tercatat sebagai pasien saya.
                </span>
              </label>
            )}

            {(consentMissing || unowned) && (
              <ConsentBasisField bare value={consent} onChange={setConsent} />
            )}

            {initialInvalid && (
              <div className="space-y-1">
                <Label htmlFor={`init-${entry.queueId}`}>Inisial Pasien *</Label>
                <Input
                  id={`init-${entry.queueId}`}
                  value={initial}
                  onChange={(ev) => setInitial(ev.target.value.toUpperCase())}
                  maxLength={MAX_INITIAL_INPUT_LENGTH}
                  placeholder="misal: BW"
                />
                <p className="text-[11px] text-gray-500">
                  Isian lama tidak memenuhi aturan inisial (maks. 4 huruf, bukan nama).
                </p>
              </div>
            )}

            {error && (
              <p role="alert" className="text-xs text-red-700">{error}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={submit} disabled={busy}>
                {busy ? "Menyimpan..." : "Simpan & Kirim"}
              </Button>
              {confirmDiscard ? (
                <>
                  <Button size="sm" variant="destructive" onClick={discard} disabled={busy}>
                    Ya, buang permanen
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmDiscard(false)} disabled={busy}>
                    Batal
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setConfirmDiscard(true)} disabled={busy}>
                  Buang
                </Button>
              )}
            </div>
            {confirmDiscard && (
              <p className="text-[11px] text-red-700">
                Data pasien ini belum ada di server — setelah dibuang tidak bisa dikembalikan.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
