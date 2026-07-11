"use client";

import { ActiveSkillProvider } from "@/components/user-menu/active-skill-context";
import { CompanyProfileProvider } from "@/components/company/company-profile-context";
import { GmailAutoSyncProvider } from "@/components/gmail/gmail-auto-sync-provider";
import { VoiceIntakeSyncProvider } from "@/components/voice/voice-intake-sync-provider";
import { SkillAccessProvider } from "@/components/auth/skill-access-provider";
import { SubscriptionSkillGate } from "@/components/subscription/subscription-skill-gate";
import { UserProfileProvider } from "@/lib/user/components/user-profile-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <UserProfileProvider>
      <SkillAccessProvider>
        <CompanyProfileProvider>
          <ActiveSkillProvider>
            <GmailAutoSyncProvider>
              <VoiceIntakeSyncProvider>
                <SubscriptionSkillGate>{children}</SubscriptionSkillGate>
              </VoiceIntakeSyncProvider>
            </GmailAutoSyncProvider>
          </ActiveSkillProvider>
        </CompanyProfileProvider>
      </SkillAccessProvider>
    </UserProfileProvider>
  );
}
