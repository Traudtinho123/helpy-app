import { isAppleCalendarConnected } from "@/features/apple-calendar/services/apple-calendar-sync";
import { getConnectedCalendarPlatform } from "@/features/calendar/services/calendar-platform";
import { getCompanyNameById } from "@/lib/company/company-profile-service";
import { MOCK_USER_PROFILE } from "@/lib/user/mock/user-profile-mock";
import { getPlatformLabel } from "@/lib/user/platform-labels";
import type {
  PlatformConnection,
  UserProfile,
  UserProfileView,
} from "@/lib/user/types/user-profile-types";

const PROFILE_CHANGE_EVENT = "helpy-user-profile-change";

const listeners = new Set<() => void>();

const DEFAULT_USER_PROFILE_SERVER_SNAPSHOT: UserProfile = MOCK_USER_PROFILE;

let userProfile: UserProfile = cloneUserProfile(MOCK_USER_PROFILE);
let userProfileSnapshot: UserProfile = DEFAULT_USER_PROFILE_SERVER_SNAPSHOT;
let userProfileViewSnapshot: UserProfileView | null = null;
let profileVersion = 0;

function cloneUserProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
    gmailConnection: { ...profile.gmailConnection },
    appleCalendarConnection: { ...profile.appleCalendarConnection },
    googleCalendarConnection: { ...profile.googleCalendarConnection },
    notificationSettings: { ...profile.notificationSettings },
    personalWorkingHours: profile.personalWorkingHours
      ? { ...profile.personalWorkingHours }
      : null,
  };
}

function profilesEqual(a: UserProfile, b: UserProfile): boolean {
  return (
    a.userId === b.userId &&
    a.companyId === b.companyId &&
    a.name === b.name &&
    a.email === b.email &&
    a.role === b.role &&
    a.avatarUrl === b.avatarUrl &&
    a.personalSignature === b.personalSignature &&
    a.gmailConnection.connected === b.gmailConnection.connected &&
    a.gmailConnection.accountEmail === b.gmailConnection.accountEmail &&
    a.gmailConnection.lastSync === b.gmailConnection.lastSync &&
    a.appleCalendarConnection.connected === b.appleCalendarConnection.connected &&
    a.appleCalendarConnection.accountEmail ===
      b.appleCalendarConnection.accountEmail &&
    a.appleCalendarConnection.lastSync === b.appleCalendarConnection.lastSync &&
    a.googleCalendarConnection.connected === b.googleCalendarConnection.connected &&
    a.googleCalendarConnection.accountEmail ===
      b.googleCalendarConnection.accountEmail &&
    a.googleCalendarConnection.lastSync === b.googleCalendarConnection.lastSync
  );
}

function buildConnectedPlatformLabels(profile: UserProfile): string[] {
  return [profile.gmailConnection, profile.appleCalendarConnection, profile.googleCalendarConnection]
    .filter((connection) => connection.connected)
    .map((connection) => getPlatformLabel(connection.platformId));
}

function refreshSnapshots(nextProfile: UserProfile): void {
  userProfileSnapshot = cloneUserProfile(nextProfile);
  userProfileViewSnapshot = {
    ...cloneUserProfile(nextProfile),
    companyName: getCompanyNameById(nextProfile.companyId),
    connectedPlatformLabels: buildConnectedPlatformLabels(nextProfile),
  };
  profileVersion += 1;
}

function commitUserProfile(nextProfile: UserProfile): boolean {
  if (profilesEqual(userProfile, nextProfile)) {
    return false;
  }

  userProfile = cloneUserProfile(nextProfile);
  refreshSnapshots(userProfile);
  return true;
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

function notifyIfChanged(changed: boolean): void {
  if (!changed) return;
  notifyListeners();
}

export function subscribeUserProfile(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getUserProfileVersion(): number {
  return profileVersion;
}

export function getUserProfile(): UserProfile {
  return cloneUserProfile(userProfile);
}

/** Pure read — keine Nebenwirkungen. */
export function getUserProfileSnapshot(): UserProfile {
  if (typeof window === "undefined") {
    return DEFAULT_USER_PROFILE_SERVER_SNAPSHOT;
  }

  return userProfileSnapshot;
}

export function getUserProfileServerSnapshot(): UserProfile {
  return DEFAULT_USER_PROFILE_SERVER_SNAPSHOT;
}

export function getUserCompanyId(): string {
  return userProfile.companyId;
}

/** Pure read — liest nur den gecachten Snapshot. */
export function getUserPersonalPlatformConnections(): PlatformConnection[] {
  const profile = userProfileSnapshot;
  return [
    { ...profile.gmailConnection },
    { ...profile.appleCalendarConnection },
    { ...profile.googleCalendarConnection },
  ];
}

export function getUserConnectedPlatformLabels(): string[] {
  return userProfileViewSnapshot?.connectedPlatformLabels ??
    buildConnectedPlatformLabels(userProfileSnapshot);
}

/** Pure read — gecachte View, keine Store-Mutation. */
export function getUserProfileView(): UserProfileView {
  if (userProfileViewSnapshot) {
    return userProfileViewSnapshot;
  }

  const profile = userProfileSnapshot;
  return {
    ...cloneUserProfile(profile),
    companyName: getCompanyNameById(profile.companyId),
    connectedPlatformLabels: buildConnectedPlatformLabels(profile),
  };
}

export function hydrateUserProfileFromAuth(input: {
  userId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}): UserProfile {
  const nextProfile: UserProfile = {
    ...userProfile,
    userId: input.userId,
    email: input.email ?? userProfile.email,
    name: input.name ?? userProfile.name,
    avatarUrl: input.avatarUrl ?? userProfile.avatarUrl,
    gmailConnection: {
      ...userProfile.gmailConnection,
      accountEmail: input.email ?? userProfile.gmailConnection.accountEmail,
    },
    googleCalendarConnection: {
      ...userProfile.googleCalendarConnection,
      accountEmail:
        input.email ?? userProfile.googleCalendarConnection.accountEmail,
    },
  };

  notifyIfChanged(commitUserProfile(nextProfile));
  return getUserProfile();
}

export function updateUserProfile(updates: Partial<UserProfile>): UserProfile {
  const nextProfile: UserProfile = {
    ...userProfile,
    ...updates,
    gmailConnection: updates.gmailConnection
      ? { ...userProfile.gmailConnection, ...updates.gmailConnection }
      : userProfile.gmailConnection,
    appleCalendarConnection: updates.appleCalendarConnection
      ? {
          ...userProfile.appleCalendarConnection,
          ...updates.appleCalendarConnection,
        }
      : userProfile.appleCalendarConnection,
    googleCalendarConnection: updates.googleCalendarConnection
      ? {
          ...userProfile.googleCalendarConnection,
          ...updates.googleCalendarConnection,
        }
      : userProfile.googleCalendarConnection,
    notificationSettings: updates.notificationSettings
      ? {
          ...userProfile.notificationSettings,
          ...updates.notificationSettings,
        }
      : userProfile.notificationSettings,
    personalWorkingHours:
      updates.personalWorkingHours === null
        ? null
        : updates.personalWorkingHours
          ? {
              ...(userProfile.personalWorkingHours ?? {
                start: "08:00",
                end: "18:00",
              }),
              ...updates.personalWorkingHours,
            }
          : userProfile.personalWorkingHours,
  };

  notifyIfChanged(commitUserProfile(nextProfile));
  return getUserProfile();
}

export function resetUserProfile(): UserProfile {
  notifyIfChanged(commitUserProfile(cloneUserProfile(MOCK_USER_PROFILE)));
  return getUserProfile();
}

export function reconcileUserPlatformConnections(input?: {
  gmailConnected?: boolean;
  gmailAccountEmail?: string | null;
}): UserProfile {
  const appleConnected = isAppleCalendarConnected();
  const calendarPlatform = getConnectedCalendarPlatform();
  const googleConnected = calendarPlatform === "google";

  const nextProfile: UserProfile = {
    ...userProfile,
    gmailConnection: {
      ...userProfile.gmailConnection,
      connected: input?.gmailConnected ?? userProfile.gmailConnection.connected,
      accountEmail:
        input?.gmailAccountEmail ?? userProfile.gmailConnection.accountEmail,
    },
    appleCalendarConnection: {
      ...userProfile.appleCalendarConnection,
      connected: appleConnected,
      accountEmail: appleConnected
        ? userProfile.appleCalendarConnection.accountEmail ?? userProfile.email
        : null,
      lastSync: appleConnected
        ? userProfile.appleCalendarConnection.lastSync ?? "gerade eben"
        : null,
    },
    googleCalendarConnection: {
      ...userProfile.googleCalendarConnection,
      connected: googleConnected,
      accountEmail: googleConnected
        ? userProfile.googleCalendarConnection.accountEmail ?? userProfile.email
        : null,
    },
  };

  notifyIfChanged(commitUserProfile(nextProfile));
  return getUserProfile();
}

export function subscribeUserProfileChanges(onStoreChange: () => void): () => void {
  const handler = () => onStoreChange();

  if (typeof window !== "undefined") {
    window.addEventListener(PROFILE_CHANGE_EVENT, handler);
  }

  const unsubscribe = subscribeUserProfile(handler);

  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener(PROFILE_CHANGE_EVENT, handler);
    }
    unsubscribe();
  };
}

// Initial snapshot für Client-Hydration.
refreshSnapshots(userProfile);
