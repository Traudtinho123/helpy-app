import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  return Object.fromEntries(
    readFileSync(resolve(root, ".env.local"), "utf8")
      .split("\n")
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      })
  );
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

const env = loadEnv();
const token = env.SUPABASE_ACCESS_TOKEN;
const url = env.NEXT_PUBLIC_SUPABASE_URL;

if (!token) {
  console.error(
    "SUPABASE_ACCESS_TOKEN fehlt in .env.local\n" +
      "→ Erstellen unter https://supabase.com/dashboard/account/tokens"
  );
  process.exit(1);
}

if (!url) {
  console.error("NEXT_PUBLIC_SUPABASE_URL fehlt in .env.local");
  process.exit(1);
}

const projectRef = new URL(url).hostname.split(".")[0];
const sql =
  readFileSync(resolve(root, "sql/onboarding-fields.sql"), "utf8") +
  "\nNOTIFY pgrst, 'reload schema';";

console.log(`Onboarding-Migration für Projekt ${projectRef}...`);

try {
  await runQuery(token, projectRef, sql, "onboarding-fields.sql");

  const columns = await runQuery(
    token,
    projectRef,
    `SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'companies'
       AND column_name IN ('onboarding_completed','onboarding_step','onboarding_completed_at')
     ORDER BY column_name;`,
    "verify companies columns"
  );

  console.table(columns);
  console.log("Migration abgeschlossen.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
