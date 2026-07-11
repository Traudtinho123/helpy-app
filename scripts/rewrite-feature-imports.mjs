#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @type {Array<[string, string]>} */
const IMPORT_REWRITES = [
  ["@/components/inbox/", "@/features/gmail/components/"],
  ["@/lib/inbox/mock-emails", "@/features/gmail/mock/mock-emails"],
  ["@/lib/integrations/gmail/", "@/features/gmail/services/gmail/"],
  ["@/lib/integrations/google/", "@/features/gmail/services/google/"],
  ["@/lib/integrations/microsoft/outlook", "@/features/gmail/services/microsoft/outlook"],
  ["@/components/kalender/", "@/features/calendar/components/"],
  ["@/lib/kalender/mock-calendar", "@/features/calendar/mock/mock-calendar"],
  ["@/lib/kalender/calendar-events-store", "@/features/calendar/services/calendar-events-store"],
  ["@/lib/integrations/microsoft/calendar", "@/features/calendar/services/microsoft/calendar"],
  ["@/lib/integrations/microsoft/types", "@/features/calendar/services/microsoft/types"],
  ["@/components/immoscout24/", "@/features/immoscout24/components/"],
  ["@/lib/immoscout24/", "@/features/immoscout24/mock/"],
  ["@/lib/integrations/immoscout24/", "@/features/immoscout24/services/"],
  ["@/components/vorgaenge/", "@/features/workspace/components/vorgaenge/"],
  ["@/components/workspace/", "@/features/workspace/components/"],
  ["@/lib/workspace/", "@/features/workspace/services/workspace/"],
  ["@/lib/vorgaenge/", "@/features/workspace/services/vorgaenge/"],
  ["@/lib/status/", "@/features/workspace/services/status/"],
  ["@/lib/decision/", "@/features/workspace/services/decision/"],
  ["@/lib/workflow-automation/", "@/features/workflow/services/automation/"],
  ["@/lib/workflow-engine/", "@/features/workflow/services/engine/"],
  ["@/lib/helpy-work/", "@/features/workflow/services/helpy-work/"],
  ["@/components/dashboard/workday/helpy-workflow-panel", "@/features/workflow/components/helpy-workflow-panel"],
  ["@/components/dashboard/workday/prepared-workflows-section", "@/features/workflow/components/prepared-workflows-section"],
  ["@/components/kunden/", "@/features/customers/components/"],
  ["@/components/timeline/", "@/features/customers/components/timeline/"],
  ["@/lib/kunden/", "@/features/customers/mock/"],
  ["@/lib/timeline/", "@/features/customers/services/timeline/"],
  ["@/components/angebote/", "@/features/offers/components/"],
  ["@/components/offers/", "@/features/offers/components/preview/"],
  ["@/lib/angebote/", "@/features/offers/mock/"],
  ["@/components/documents/", "@/features/documents/components/"],
  ["@/lib/document-engine/", "@/features/documents/services/"],
  ["@/components/memory/", "@/features/memory/components/"],
  ["@/lib/memory/", "@/features/memory/services/"],
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
  ["@/components/review/", "@/features/review/components/"],
  ["@/components/actions/", "@/features/review/components/actions/"],
  ["@/lib/review/", "@/features/review/services/"],
  ["@/lib/safety/", "@/features/review/services/safety/"],
  ["@/lib/actions/", "@/features/review/services/actions/"],
  ["@/components/plattformen/", "@/features/platforms/components/"],
  ["@/lib/helpy-platform/", "@/features/platforms/services/platform/"],
  ["@/lib/connect/", "@/features/platforms/services/connect/"],
  ["@/lib/integrations/forms/", "@/features/platforms/services/integrations/forms/"],
  ["@/lib/integrations/connect", "@/features/platforms/services/integrations/connect"],
  ["@/lib/integrations/provider", "@/features/platforms/services/integrations/provider"],
  ["@/lib/integrations/types", "@/features/platforms/services/integrations/types"],
  ["@/lib/integrations/index", "@/features/platforms/services/integrations/index"],
  ["@/lib/integrations/", "@/features/platforms/services/integrations/"],
  ["@/components/aufgaben/", "@/features/tasks/components/"],
  // Barrel imports (no trailing path)
  ["@/components/memory", "@/features/memory/components"],
  ["@/components/actions", "@/features/review/components/actions"],
  ["@/components/review", "@/features/review/components"],
  ["@/components/timeline", "@/features/customers/components/timeline"],
  ["@/components/offers", "@/features/offers/components/preview"],
  ["@/lib/workspace", "@/features/workspace/services/workspace"],
  ["@/lib/brain-v2", "@/features/brain/services/brain-v2"],
  ["@/lib/memory", "@/features/memory/services"],
  ["@/lib/timeline", "@/features/customers/services/timeline"],
  ["@/lib/status", "@/features/workspace/services/status"],
  ["@/lib/decision", "@/features/workspace/services/decision"],
  ["@/lib/review", "@/features/review/services"],
  ["@/lib/safety", "@/features/review/services/safety"],
  ["@/lib/actions", "@/features/review/services/actions"],
  ["@/lib/document-engine", "@/features/documents/services"],
  ["@/lib/connect", "@/features/platforms/services/connect"],
  ["@/lib/helpy-platform", "@/features/platforms/services/platform"],
  ["@/lib/helpy-actions", "@/features/brain/services/helpy-actions"],
  ["@/lib/helpy-brain", "@/features/brain/services/helpy-brain"],
  ["@/lib/helpy-intake", "@/features/brain/services/intake"],
  ["@/lib/workflow-automation", "@/features/workflow/services/automation"],
  ["@/lib/workflow-engine", "@/features/workflow/services/engine"],
  ["@/lib/helpy-work", "@/features/workflow/services/helpy-work"],
  ["@/lib/helpy-autopilot", "@/features/brain/services/autopilot"],
];

function walkFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, acc);
    else if (/\.(tsx?|mts)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

let changed = 0;
for (const file of walkFiles(ROOT)) {
  const original = fs.readFileSync(file, "utf8");
  let updated = original;
  for (const [from, to] of IMPORT_REWRITES) {
    updated = updated.split(from).join(to);
  }
  if (updated !== original) {
    fs.writeFileSync(file, updated);
    changed++;
  }
}
console.log(`Rewrote imports in ${changed} files.`);
