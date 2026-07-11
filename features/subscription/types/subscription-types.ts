import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export type SubscriptionStatus = "active" | "inactive" | "trial";

export type CompanySubscription = {
  companyId: string;
  planName: string;
  activePaidSkill: HelpySkill;
  allowedSkills: HelpySkill[];
  lockedSkills: HelpySkill[];
  status: SubscriptionStatus;
};

export type SkillAccessState = {
  subscription: CompanySubscription;
  /** true wenn Nutzer Zugang hat (DB-Skill freigeschaltet). */
  skillConfirmed: boolean;
  /** true wenn profiles.allowed_skills mindestens einen Eintrag hat. */
  hasDatabaseAccess: boolean;
};
