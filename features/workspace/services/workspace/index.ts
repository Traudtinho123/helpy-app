export {
  DEFAULT_VORGANG_ID,
  getVorgang,
  getVorgangPath,
} from "@/features/workspace/services/workspace/mock-vorgaenge";

export {
  getListeVorgang,
  getWorkspacePath,
  getWorkspaceVorgang,
} from "@/features/workspace/services/workspace/workspace-engine";

export {
  DEFAULT_HELPY_SKILL,
  getSkillConfig,
  getSkillMonitorConfig,
  HELPY_SKILLS,
  SKILL_MONITOR_CONFIG,
} from "@/features/workspace/services/workspace/skills";
export type { HelpySkill, HelpySkillConfig, SkillMonitorConfig, SkillEmpfohleneAktion, SkillTabDefinition } from "@/features/workspace/services/workspace/skills";

export type {
  Vorgang,
  VorgangAngebot,
  VorgangAngebotPosition,
  VorgangAufgabe,
  VorgangDokument,
  VorgangEmail,
  VorgangHelpy,
  VorgangKopfzeile,
  VorgangKunde,
  VorgangTermin,
} from "@/features/workspace/services/workspace/types";
