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
  // Cloud Workstations / Firebase Studio preview URLs are "{port}-{WEB_HOST}" and the
  // port changes across restarts, so match it with a wildcard instead of a fixed BETTER_AUTH_URL.
  ...(process.env.WEB_HOST ? [`https://*-${process.env.WEB_HOST}`] : []),
].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

// Same set of hosts as trustedOrigins, but without the protocol — lets better-auth
// build correct links/redirects for whichever preview host made the request,
// instead of always using the (possibly stale) BETTER_AUTH_URL.
const allowedHosts: string[] = trustedOrigins
  .map((origin) => {
    try {
      return new URL(origin).host;
    } catch {
      return null;
    }
  })
  .filter((host): host is string => !!host)
  .filter((v, i, a) => a.indexOf(v) === i);

export const auth = betterAuth({
  baseURL: {
    allowedHosts,
    fallback: appUrl,
    protocol: "auto",
  },
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  advanced: {
    // Decide the cookie's Secure flag from how the app is actually running, not
    // from whatever URL happens to be in BETTER_AUTH_URL. With a static `baseURL`
    // string, the old code derived secure from `BETTER_AUTH_URL.startsWith("https://")`:
    // when that env var pointed at a stale/wrong host (e.g. a cached Cloud
    // Workstations preview URL after the port changed), the cookie could end up
    // `Secure` while the page was actually served over plain http — the browser
    // then silently drops the cookie. Sign-in still returns 200 with no error, the
    // session just never sticks and the user bounces back to /login. Tying it to
    // NODE_ENV instead is correct for both dev (always plain/non-secure, works
    // over the https preview tunnel too) and Vercel (NODE_ENV=production, always
    // https).
    useSecureCookies: process.env.NODE_ENV === "production",
  },
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
