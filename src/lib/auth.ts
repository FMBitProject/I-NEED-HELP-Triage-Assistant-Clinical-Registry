import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import * as schema from "./db/schema";

const appUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";

// Collect all trusted origins from env so dev environments (cloud workstations,
// Vercel preview URLs) don't get rejected with 403.
const trustedOrigins: string[] = [
  "http://localhost:3000",
  appUrl,
  // Vercel auto-injects these: VERCEL_URL = deployment URL, VERCEL_PROJECT_PRODUCTION_URL = production URL
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
  ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

export const auth = betterAuth({
  baseURL: appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      institutionType: {
        type: "string",
        required: false,
        fieldName: "institutionType",
      },
      role: {
        type: "string",
        defaultValue: "DOCTOR",
        fieldName: "role",
      },
      researchConsent: {
        type: "boolean",
        defaultValue: false,
        fieldName: "researchConsent",
      },
      ethicalClearanceNo: {
        type: "string",
        required: false,
        fieldName: "ethicalClearanceNo",
      },
      ethicalClearanceDate: {
        type: "string",
        required: false,
        fieldName: "ethicalClearanceDate",
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
