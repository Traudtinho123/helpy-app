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

const env = loadEnv();
const token = env.SUPABASE_ACCESS_TOKEN;
const url = env.NEXT_PUBLIC_SUPABASE_URL;

if (!token || !url) {
  console.error("Fehlt SUPABASE_ACCESS_TOKEN oder NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

const projectRef = new URL(url).hostname.split(".")[0];
const query = readFileSync(resolve(root, "sql/deals-pipeline.sql"), "utf8");

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

const body = await response.text();
if (!response.ok) {
  console.error("Migration fehlgeschlagen:", response.status, body);
  process.exit(1);
}

console.log("Deal-Pipeline Migration erfolgreich.");
