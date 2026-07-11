#!/usr/bin/env node
/**
 * Architecture Sprint v1 — move feature code into features/ and rewrite imports.
 * Run from repo root: node scripts/migrate-features.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @type {Array<[string, string]>} */
const MOVES = [
  // gmail
  ["components/inbox", "features/gmail/components"],
  ["lib/inbox/mock-emails.ts", "features/gmail/mock/mock-emails.ts"],
  ["lib/integrations/gmail", "features/gmail/services/gmail"],
  ["lib/integrations/google", "features/gmail/services/google"],
  ["lib/integrations/microsoft/outlook.ts", "features/gmail/services/microsoft/outlook.ts"],

  // calendar
  ["components/kalender", "features/calendar/components"],
  ["lib/kalender/mock-calendar.ts", "features/calendar/mock/mock-calendar.ts"],
  ["lib/kalender/calendar-events-store.ts", "features/calendar/services/calendar-events-store.ts"],
  ["lib/integrations/microsoft/calendar.ts", "features/calendar/services/microsoft/calendar.ts"],
  ["lib/integrations/microsoft/types.ts", "features/calendar/services/microsoft/types.ts"],

  // immoscout24
  ["components/immoscout24", "features/immoscout24/components"],
  ["lib/immoscout24", "features/immoscout24/mock"],
  ["lib/integrations/immoscout24", "features/immoscout24/services"],

  // workspace
  ["components/workspace", "features/workspace/components"],
  ["components/vorgaenge", "features/workspace/components/vorgaenge"],
  ["lib/workspace", "features/workspace/services/workspace"],
  ["lib/vorgaenge", "features/workspace/services/vorgaenge"],
  ["lib/status", "features/workspace/services/status"],
  ["lib/decision", "features/workspace/services/decision"],

  // workflow
  ["lib/workflow-automation", "features/workflow/services/automation"],
  ["lib/workflow-engine", "features/workflow/services/engine"],
  ["lib/helpy-work", "features/workflow/services/helpy-work"],
  ["components/dashboard/workday/helpy-workflow-panel.tsx", "features/workflow/components/helpy-workflow-panel.tsx"],
  ["components/dashboard/workday/prepared-workflows-section.tsx", "features/workflow/components/prepared-workflows-section.tsx"],

  // customers
  ["components/kunden", "features/customers/components"],
  ["components/timeline", "features/customers/components/timeline"],
  ["lib/kunden", "features/customers/mock"],
  ["lib/timeline", "features/customers/services/timeline"],

  // offers
  ["components/angebote", "features/offers/components"],
  ["components/offers", "features/offers/components/preview"],
  ["lib/angebote", "features/offers/mock"],

  // documents
  ["components/documents", "features/documents/components"],
  ["lib/document-engine", "features/documents/services"],

  // memory
  ["components/memory", "features/memory/components"],
  ["lib/memory", "features/memory/services"],

  // brain
  ["lib/brain-v2", "features/brain/services/brain-v2"],
  ["lib/helpy-brain", "features/brain/services/helpy-brain"],
  ["lib/helpy-intake", "features/brain/services/intake"],
  ["lib/helpy-autopilot", "features/brain/services/autopilot"],
  ["lib/helpy-actions", "features/brain/services/helpy-actions"],
  ["components/dashboard/autopilot", "features/brain/components/autopilot"],
  ["components/dashboard/workday/meinarbeitstag-page.tsx", "features/brain/components/workday/meinarbeitstag-page.tsx"],
  ["components/dashboard/workday/workday-experience.tsx", "features/brain/components/workday/workday-experience.tsx"],
  ["components/dashboard/workday/workday-helpy-messages.tsx", "features/brain/components/workday/workday-helpy-messages.tsx"],
  ["components/dashboard/workday/workday-helpy-panel.tsx", "features/brain/components/workday/workday-helpy-panel.tsx"],

  // review
  ["components/review", "features/review/components"],
  ["components/actions", "features/review/components/actions"],
  ["lib/review", "features/review/services"],
  ["lib/safety", "features/review/services/safety"],
  ["lib/actions", "features/review/services/actions"],

  // platforms
  ["components/plattformen", "features/platforms/components"],
  ["lib/helpy-platform", "features/platforms/services/platform"],
  ["lib/connect", "features/platforms/services/connect"],
  ["lib/integrations/connect.ts", "features/platforms/services/integrations/connect.ts"],
  ["lib/integrations/provider.ts", "features/platforms/services/integrations/provider.ts"],
  ["lib/integrations/types.ts", "features/platforms/services/integrations/types.ts"],
  ["lib/integrations/index.ts", "features/platforms/services/integrations/index.ts"],
  ["lib/integrations/forms", "features/platforms/services/integrations/forms"],

  // tasks
  ["components/aufgaben", "features/tasks/components"],
];

/** Import path rewrites — longest / most specific first */
/** @type {Array<[string, string]>} */
const IMPORT_REWRITES = [
  // gmail
  ["@/components/inbox/", "@/features/gmail/components/"],
  ["@/lib/inbox/mock-emails", "@/features/gmail/mock/mock-emails"],
  ["@/lib/integrations/gmail/", "@/features/gmail/services/gmail/"],
  ["@/lib/integrations/google/", "@/features/gmail/services/google/"],
  ["@/lib/integrations/microsoft/outlook", "@/features/gmail/services/microsoft/outlook"],

  // calendar
  ["@/components/kalender/", "@/features/calendar/components/"],
  ["@/lib/kalender/mock-calendar", "@/features/calendar/mock/mock-calendar"],
  ["@/lib/kalender/calendar-events-store", "@/features/calendar/services/calendar-events-store"],
  ["@/lib/integrations/microsoft/calendar", "@/features/calendar/services/microsoft/calendar"],
  ["@/lib/integrations/microsoft/types", "@/features/calendar/services/microsoft/types"],

  // immoscout24
  ["@/components/immoscout24/", "@/features/immoscout24/components/"],
  ["@/lib/immoscout24/", "@/features/immoscout24/mock/"],
  ["@/lib/integrations/immoscout24/", "@/features/immoscout24/services/"],

  // workspace
  ["@/components/vorgaenge/", "@/features/workspace/components/vorgaenge/"],
  ["@/components/workspace/", "@/features/workspace/components/"],
  ["@/lib/workspace/", "@/features/workspace/services/workspace/"],
  ["@/lib/vorgaenge/", "@/features/workspace/services/vorgaenge/"],
  ["@/lib/status/", "@/features/workspace/services/status/"],
  ["@/lib/decision/", "@/features/workspace/services/decision/"],

  // workflow
  ["@/lib/workflow-automation/", "@/features/workflow/services/automation/"],
  ["@/lib/workflow-engine/", "@/features/workflow/services/engine/"],
  ["@/lib/helpy-work/", "@/features/workflow/services/helpy-work/"],
  ["@/components/dashboard/workday/helpy-workflow-panel", "@/features/workflow/components/helpy-workflow-panel"],
  ["@/components/dashboard/workday/prepared-workflows-section", "@/features/workflow/components/prepared-workflows-section"],

  // customers
  ["@/components/kunden/", "@/features/customers/components/"],
  ["@/components/timeline/", "@/features/customers/components/timeline/"],
  ["@/lib/kunden/", "@/features/customers/mock/"],
  ["@/lib/timeline/", "@/features/customers/services/timeline/"],

  // offers
  ["@/components/angebote/", "@/features/offers/components/"],
  ["@/components/offers/", "@/features/offers/components/preview/"],
  ["@/lib/angebote/", "@/features/offers/mock/"],

  // documents
  ["@/components/documents/", "@/features/documents/components/"],
  ["@/lib/document-engine/", "@/features/documents/services/"],

  // memory
  ["@/components/memory/", "@/features/memory/components/"],
  ["@/lib/memory/", "@/features/memory/services/"],

  // brain
  ["@/lib/brain-v2/", "@/features/brain/services/brain-v2/"],
  ["@/lib/helpy-brain/", "@/features/brain/services/helpy-brain/"],
  ["@/lib/helpy-intake/", "@/features/brain/services/intake/"],
  ["@/lib/helpy-autopilot/", "@/features/brain/services/autopilot/"],
  ["@/lib/helpy-actions/", "@/features/brain/services/helpy-actions/"],
  ["@/components/dashboard/autopilot/", "@/features/brain/components/autopilot/"],
  ["@/components/dashboard/workday/meinarbeitstag-page", "@/features/brain/components/workday/meinarbeitstag-page"],
  ["@/components/dashboard/workday/workday-experience", "@/features/brain/components/workday/workday-experience"],
  ["@/components/dashboard/workday/workday-helpy-messages", "@/features/brain/components/workday/workday-helpy-messages"],
  ["@/components/dashboard/workday/workday-helpy-panel", "@/features/brain/components/workday/workday-helpy-panel"],

  // review
  ["@/components/review/", "@/features/review/components/"],
  ["@/components/actions/", "@/features/review/components/actions/"],
  ["@/lib/review/", "@/features/review/services/"],
  ["@/lib/safety/", "@/features/review/services/safety/"],
  ["@/lib/actions/", "@/features/review/services/actions/"],

  // platforms
  ["@/components/plattformen/", "@/features/platforms/components/"],
  ["@/lib/helpy-platform/", "@/features/platforms/services/platform/"],
  ["@/lib/connect/", "@/features/platforms/services/connect/"],
  ["@/lib/integrations/forms/", "@/features/platforms/services/integrations/forms/"],
  ["@/lib/integrations/connect", "@/features/platforms/services/integrations/connect"],
  ["@/lib/integrations/provider", "@/features/platforms/services/integrations/provider"],
  ["@/lib/integrations/types", "@/features/platforms/services/integrations/types"],
  ["@/lib/integrations/index", "@/features/platforms/services/integrations/index"],
  ["@/lib/integrations/", "@/features/platforms/services/integrations/"],

  // tasks
  ["@/components/aufgaben/", "@/features/tasks/components/"],
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function movePath(fromRel, toRel) {
  const from = path.join(ROOT, fromRel);
  const to = path.join(ROOT, toRel);
  if (!fs.existsSync(from)) {
    console.warn(`SKIP (missing): ${fromRel}`);
    return;
  }
  ensureDir(path.dirname(to));
  fs.renameSync(from, to);
  console.log(`MOVED ${fromRel} → ${toRel}`);
}

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "features") continue;
    if (entry.isDirectory()) walkFiles(full, acc);
    else if (/\.(tsx?|mts)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

function rewriteImports(content) {
  let out = content;
  for (const [from, to] of IMPORT_REWRITES) {
    out = out.split(from).join(to);
  }
  return out;
}

// Execute moves (directories first — process in reverse order of nesting for dirs? Actually mv whole dirs)
for (const [from, to] of MOVES) {
  movePath(from, to);
}

// Rewrite all source imports
const files = walkFiles(ROOT);
let changed = 0;
for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const updated = rewriteImports(original);
  if (updated !== original) {
    fs.writeFileSync(file, updated);
    changed++;
  }
}

console.log(`\nUpdated imports in ${changed} files.`);
