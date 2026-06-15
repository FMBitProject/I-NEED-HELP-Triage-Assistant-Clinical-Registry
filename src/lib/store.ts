"use client";

import { Doctor, Outcome, Patient, TriageLog } from "./types";

const STORAGE_KEYS = {
  DOCTOR: "inh_doctor",
  PATIENTS: "inh_patients",
  TRIAGE_LOGS: "inh_triage_logs",
  OUTCOMES: "inh_outcomes",
};

function get<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function set<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

export const store = {
  // Doctor (auth)
  getDoctor: (): Doctor | null => {
    if (typeof window === "undefined") return null;
    try {
      const d = localStorage.getItem(STORAGE_KEYS.DOCTOR);
      return d ? JSON.parse(d) : null;
    } catch {
      return null;
    }
  },
  setDoctor: (doctor: Doctor | null) => {
    if (typeof window === "undefined") return;
    if (doctor) {
      localStorage.setItem(STORAGE_KEYS.DOCTOR, JSON.stringify(doctor));
    } else {
      localStorage.removeItem(STORAGE_KEYS.DOCTOR);
    }
  },

  // Patients
  getPatients: (): Patient[] => get<Patient>(STORAGE_KEYS.PATIENTS),
  getPatient: (id: string): Patient | undefined =>
    get<Patient>(STORAGE_KEYS.PATIENTS).find((p) => p.id === id),
  addPatient: (patient: Patient): void => {
    const patients = get<Patient>(STORAGE_KEYS.PATIENTS);
    set(STORAGE_KEYS.PATIENTS, [...patients, patient]);
  },

  // Triage Logs
  getTriageLogs: (): TriageLog[] => get<TriageLog>(STORAGE_KEYS.TRIAGE_LOGS),
  getTriageLog: (id: string): TriageLog | undefined =>
    get<TriageLog>(STORAGE_KEYS.TRIAGE_LOGS).find((t) => t.id === id),
  getTriageLogByPatient: (patientId: string): TriageLog | undefined =>
    get<TriageLog>(STORAGE_KEYS.TRIAGE_LOGS).find(
      (t) => t.patientId === patientId
    ),
  addTriageLog: (log: TriageLog): void => {
    const logs = get<TriageLog>(STORAGE_KEYS.TRIAGE_LOGS);
    set(STORAGE_KEYS.TRIAGE_LOGS, [...logs, log]);
  },

  // Outcomes
  getOutcomes: (): Outcome[] => get<Outcome>(STORAGE_KEYS.OUTCOMES),
  getOutcomeByPatient: (patientId: string): Outcome | undefined =>
    get<Outcome>(STORAGE_KEYS.OUTCOMES).find((o) => o.patientId === patientId),
  addOutcome: (outcome: Outcome): void => {
    const outcomes = get<Outcome>(STORAGE_KEYS.OUTCOMES);
    const existing = outcomes.findIndex((o) => o.patientId === outcome.patientId);
    if (existing >= 0) {
      outcomes[existing] = outcome;
      set(STORAGE_KEYS.OUTCOMES, outcomes);
    } else {
      set(STORAGE_KEYS.OUTCOMES, [...outcomes, outcome]);
    }
  },

  // Seed demo data
  seedDemoData: (doctorId: string) => {
    const existing = get<Patient>(STORAGE_KEYS.PATIENTS);
    if (existing.length > 0) return;

    const now = new Date();
    const daysAgo = (d: number) =>
      new Date(now.getTime() - d * 86400000).toISOString();

    const patients: Patient[] = [
      {
        id: "p1",
        doctorId,
        patientInitial: "BW",
        age: 65,
        gender: "M",
        systolicBp: 90,
        diastolicBp: 60,
        heartRate: 105,
        lvef: 25,
        comorbidDm: true,
        comorbidHtn: true,
        comorbidCkd: false,
        comorbidAf: true,
        onAceArni: false,
        onBb: true,
        onMra: false,
        onSglt2i: false,
        createdAt: daysAgo(30),
      },
      {
        id: "p2",
        doctorId,
        patientInitial: "SR",
        age: 55,
        gender: "F",
        systolicBp: 130,
        diastolicBp: 80,
        heartRate: 78,
        lvef: 40,
        egfr: 65,
        comorbidDm: false,
        comorbidHtn: true,
        comorbidCkd: false,
        comorbidAf: false,
        onAceArni: true,
        onBb: true,
        onMra: true,
        onSglt2i: true,
        createdAt: daysAgo(20),
      },
      {
        id: "p3",
        doctorId,
        patientInitial: "AM",
        age: 72,
        gender: "M",
        systolicBp: 110,
        diastolicBp: 70,
        heartRate: 92,
        lvef: 30,
        ntProbnp: 3500,
        comorbidDm: true,
        comorbidHtn: true,
        comorbidCkd: true,
        comorbidAf: false,
        onAceArni: true,
        onBb: false,
        onMra: true,
        onSglt2i: false,
        createdAt: daysAgo(15),
      },
      {
        id: "p4",
        doctorId,
        patientInitial: "DK",
        age: 48,
        gender: "F",
        systolicBp: 120,
        diastolicBp: 75,
        heartRate: 72,
        lvef: 50,
        comorbidDm: false,
        comorbidHtn: false,
        comorbidCkd: false,
        comorbidAf: false,
        onAceArni: true,
        onBb: true,
        onMra: false,
        onSglt2i: true,
        createdAt: daysAgo(7),
      },
      {
        id: "p5",
        doctorId,
        patientInitial: "RH",
        age: 61,
        gender: "M",
        systolicBp: 95,
        diastolicBp: 62,
        heartRate: 110,
        comorbidDm: true,
        comorbidHtn: false,
        comorbidCkd: true,
        comorbidAf: true,
        onAceArni: false,
        onBb: false,
        onMra: false,
        onSglt2i: false,
        createdAt: daysAgo(3),
      },
    ];

    const logs: TriageLog[] = [
      {
        id: "t1",
        patientId: "p1",
        score: 4,
        criteriaMet: {
          I: false, N: true, E1: true, E2: true, D: false, H: true, E3: false, L: true, P: false,
        },
        recommendationGiven: "REFER",
        createdAt: daysAgo(30),
      },
      {
        id: "t2",
        patientId: "p2",
        score: 0,
        criteriaMet: {
          I: false, N: false, E1: false, E2: false, D: false, H: false, E3: false, L: false, P: false,
        },
        recommendationGiven: "CONTINUE_GDMT",
        createdAt: daysAgo(20),
      },
      {
        id: "t3",
        patientId: "p3",
        score: 3,
        criteriaMet: {
          I: false, N: true, E1: false, E2: true, D: false, H: true, E3: false, L: false, P: false,
        },
        recommendationGiven: "REFER",
        createdAt: daysAgo(15),
      },
      {
        id: "t4",
        patientId: "p4",
        score: 0,
        criteriaMet: {
          I: false, N: false, E1: false, E2: false, D: false, H: false, E3: false, L: false, P: false,
        },
        recommendationGiven: "CONTINUE_GDMT",
        createdAt: daysAgo(7),
      },
      {
        id: "t5",
        patientId: "p5",
        score: 3,
        criteriaMet: {
          I: false, N: false, E1: false, E2: false, D: false, H: false, E3: true, L: true, P: true,
        },
        recommendationGiven: "REFER",
        createdAt: daysAgo(3),
      },
    ];

    const outcomes: Outcome[] = [
      {
        id: "o1",
        patientId: "p1",
        status: "REFERRED",
        followUpDays: 1,
        recordedAt: daysAgo(29),
      },
      {
        id: "o2",
        patientId: "p2",
        status: "STABLE",
        followUpDays: 20,
        recordedAt: daysAgo(0),
      },
    ];

    set(STORAGE_KEYS.PATIENTS, patients);
    set(STORAGE_KEYS.TRIAGE_LOGS, logs);
    set(STORAGE_KEYS.OUTCOMES, outcomes);
  },

  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  },
};
