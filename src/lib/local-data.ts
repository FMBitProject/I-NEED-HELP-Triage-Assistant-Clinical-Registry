// Pembersihan data pasien yang tersimpan di perangkat (UU PDP: HP/komputer
// di RS sering dipakai bergantian).
//
// Yang dibersihkan: salinan respons API pasien di Cache Storage (dibuat
// public/sw.js untuk mode offline).
// Yang TIDAK dibersihkan: antrean offline (IndexedDB) — itu data klinis yang
// belum tersimpan di server. Entri antrean terikat ke ownerId, jadi user lain
// yang login di perangkat ini tidak bisa melihat maupun mengirimnya.

const CLEAR_MESSAGE = { type: "CLEAR_PATIENT_DATA" } as const;

function isPatientApiUrl(url: string): boolean {
  try {
    return new URL(url, location.origin).pathname.startsWith("/api/");
  } catch {
    return false;
  }
}

/** Tidak pernah melempar error — logout tidak boleh tertahan oleh langkah ini. */
export async function clearLocalPatientData(): Promise<void> {
  // 1) Minta service worker membersihkan dari dalam: SW juga menandai
  //    "generasi" baru sehingga respons /api/ yang masih di jalan saat logout
  //    tidak ditulis ulang ke cache setelah dihapus (race condition).
  try {
    navigator.serviceWorker?.controller?.postMessage(CLEAR_MESSAGE);
  } catch {
    // SW tidak tersedia — lanjut ke pembersihan langsung.
  }

  // 2) Bersihkan langsung juga: untuk browser tanpa SW aktif / SW lama yang
  //    belum punya handler pesan di atas.
  try {
    if (typeof caches === "undefined") return;
    const names = await caches.keys();
    await Promise.all(
      names.map(async (name) => {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        await Promise.all(
          requests.filter((r) => isPatientApiUrl(r.url)).map((r) => cache.delete(r))
        );
      })
    );
  } catch (err) {
    // Cache API diblokir (mis. mode privat) — tidak ada yang tersimpan.
    console.warn("[logout] gagal membersihkan cache lokal", err);
  }
}
