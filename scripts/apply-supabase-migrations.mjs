import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  return Object.fromEntries(
    readFileSync(resolve(root, ".env.local"), "utf8")
      .split("\n")
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      })
  );
}

function projectRefFromUrl(url) {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) throw new Error("NEXT_PUBLIC_SUPABASE_URL ungültig");
  return match[1];
}

async function runQuery(token, projectRef, query, label) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    throw new Error(
      `[${label}] HTTP ${response.status}: ${
        typeof body === "string" ? body : JSON.stringify(body)
      }`
    );
  }

  console.log(`✓ ${label}`);
  return body;
}

function readMigration(filename) {
  return readFileSync(resolve(root, "supabase/migrations", filename), "utf8");
}

const BACKFILL_SQL = `
INSERT INTO public.profiles (id, sprache)
SELECT u.id, 'de'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

NOTIFY pgrst, 'reload schema';
`;

const env = loadEnv();
const token = env.SUPABASE_ACCESS_TOKEN;
const url = env.NEXT_PUBLIC_SUPABASE_URL;

if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN fehlt in .env.local");
  process.exit(1);
}

if (!url) {
  console.error("NEXT_PUBLIC_SUPABASE_URL fehlt in .env.local");
  process.exit(1);
}

const projectRef = projectRefFromUrl(url);

const steps = [
  {
    label: "20260706150000_helpy_office_schema.sql",
    sql: readMigration("20260706150000_helpy_office_schema.sql"),
  },
  {
    label: "20260709120000_completed_vorgaenge.sql",
    sql: readMigration("20260709120000_completed_vorgaenge.sql"),
  },
  {
    label: "20260709140000_profile_allowed_skills.sql",
    sql: readMigration("20260709140000_profile_allowed_skills.sql"),
  },
  {
    label: "20260709180000_companies_tenant.sql",
    sql: readMigration("20260709180000_companies_tenant.sql"),
  },
  {
    label: "20260709181000_fix_profiles_rls_recursion.sql",
    sql: readMigration("20260709181000_fix_profiles_rls_recursion.sql"),
  },
  {
    label: "backfill profiles + schema reload",
    sql: BACKFILL_SQL,
  },
];

console.log(`Applying ${steps.length} steps to project ${projectRef}...`);

for (const step of steps) {
  await runQuery(token, projectRef, step.sql, step.label);
}

console.log("All migrations applied.");
