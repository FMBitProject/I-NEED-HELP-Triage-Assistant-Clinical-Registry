import {
  boolean,
  date,
  integer,
  json,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { TriageCriteria } from "../types";

// ─── Better Auth required tables ──────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // Custom app fields
  institutionType: text("institution_type"),
  role: text("role").notNull().default("DOCTOR"),
  // Defaults to true at the DB level so accounts that existed before this
  // column was introduced are grandfathered in as approved. New sign-ups are
  // explicitly created with approved=false via auth.ts additionalFields.
  approved: boolean("approved").notNull().default(true),
  researchConsent: boolean("research_consent").notNull().default(false),
  ethicalClearanceNo: text("ethical_clearance_no"),
  ethicalClearanceDate: text("ethical_clearance_date"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── App enums ────────────────────────────────────────────────────────────────

export const genderEnum = pgEnum("gender", ["M", "F"]);

export const recommendationEnum = pgEnum("recommendation", [
  "REFER",
  "CONTINUE_GDMT",
]);

export const outcomeStatusEnum = pgEnum("outcome_status", [
  "STABLE",
  "HOSPITALIZED",
  "REFERRED",
  "DECEASED",
  "LOST_TO_FOLLOWUP",
]);

// ─── App tables ───────────────────────────────────────────────────────────────

export const patients = pgTable("patients", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  doctorId: text("doctor_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  patientInitial: text("patient_initial").notNull(),
  age: integer("age").notNull(),
  gender: genderEnum("gender").notNull(),
  systolicBp: integer("systolic_bp").notNull(),
  diastolicBp: integer("diastolic_bp").notNull(),
  heartRate: integer("heart_rate").notNull(),
  lvef: integer("lvef"),
  egfr: numeric("egfr", { precision: 6, scale: 2 }),
  ntProbnp: integer("nt_probnp"),
  nyhaClass: text("nyha_class"),
  // Disposisi akhir kunjungan IGD — endpoint minimal yang diketahui dokter
  // hari itu juga, tanpa perlu follow-up: DISCHARGED | ADMITTED | REFERRED |
  // DECEASED_ED. Nullable agar data lama tetap valid.
  edDisposition: text("ed_disposition"),
  comorbidDm: boolean("comorbid_dm").notNull().default(false),
  comorbidHtn: boolean("comorbid_htn").notNull().default(false),
  comorbidCkd: boolean("comorbid_ckd").notNull().default(false),
  comorbidAf: boolean("comorbid_af").notNull().default(false),
  onAceArni: boolean("on_ace_arni").notNull().default(false),
  onBb: boolean("on_bb").notNull().default(false),
  onMra: boolean("on_mra").notNull().default(false),
  onSglt2i: boolean("on_sglt2i").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  finalizedAt: timestamp("finalized_at"),
});

export const triageLogs = pgTable("triage_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  patientId: text("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  criteriaMet: json("criteria_met").$type<TriageCriteria>().notNull(),
  recommendationGiven: recommendationEnum("recommendation_given").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const outcomes = pgTable("outcomes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  patientId: text("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  status: outcomeStatusEnum("status").notNull(),
  followUpDays: integer("follow_up_days").notNull().default(30),
  notes: text("notes"),
  admissionDate: date("admission_date"),
  dischargeDate: date("discharge_date"),
  notReferredReason: text("not_referred_reason"),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  patientId: text("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  userName: text("user_name"),
  action: text("action").notNull(), // 'create' | 'update' | 'finalize' | 'unlock_request' | 'delete'
  changedField: text("changed_field"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
