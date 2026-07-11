import type { CompanySubscription } from "@/features/subscription/types/subscription-types";

/** MVP-Mock — später aus Abo / Backend laden. */
export const MOCK_COMPANY_SUBSCRIPTION: CompanySubscription = {
  companyId: "helpy-demo-company",
  planName: "HELPY Real Estate Pro",
  activePaidSkill: "real-estate",
  allowedSkills: ["real-estate"],
  lockedSkills: ["construction", "consulting-legal"],
  status: "active",
};
