import { countActiveVoiceCallsForCompany } from "@/lib/voice/voice-call-repository";
import { countInMemoryVoiceSessionsForCompany } from "@/lib/voice/voice-call-session-store";

export const MAX_CONCURRENT_VOICE_CALLS_PER_COMPANY = 10;

export async function isVoiceRateLimitExceeded(companyId: string): Promise<boolean> {
  const [dbCount, memoryCount] = await Promise.all([
    countActiveVoiceCallsForCompany(companyId),
    Promise.resolve(countInMemoryVoiceSessionsForCompany(companyId)),
  ]);

  return Math.max(dbCount, memoryCount) >= MAX_CONCURRENT_VOICE_CALLS_PER_COMPANY;
}
