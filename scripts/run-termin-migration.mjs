import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!accessToken || !supabaseUrl) {
  console.error(
    "Fehlt: SUPABASE_ACCESS_TOKEN und NEXT_PUBLIC_SUPABASE_URL in .env.local"
  );
  process.exit(1);
}

const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const sqlPath = resolve(
  root,
  "supabase/migrations/20260713180000_vorgang_termin_fields.sql"
);
const query = readFileSync(sqlPath, "utf8");

const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  }
);

const body = await response.text();
let parsed;
try {
  parsed = JSON.parse(body);
} catch {
  parsed = body;
}

if (!response.ok) {
  console.error("Migration fehlgeschlagen:", response.status, parsed);
  process.exit(1);
}

console.log("Migration erfolgreich ausgeführt.");
console.log(JSON.stringify(parsed, null, 2));

const verify = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'vorgaenge'
          AND column_name LIKE 'termin_%'
        ORDER BY column_name;`,
    }),
  }
);

const verifyBody = await verify.json();
console.log("\nNeue Spalten:");
console.table(verifyBody);
