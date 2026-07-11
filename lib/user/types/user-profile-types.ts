export type UserRole = "owner" | "admin" | "member";

export type WorkingHours = {
  start: string;
  end: string;
};

export type NotificationSettings = {
  email: boolean;
  push: boolean;
  digest: boolean;
};

export type PlatformConnection = {
  platformId: string;
  connected: boolean;
  accountEmail: string | null;
  lastSync: string | null;
};

export type UserProfile = {
  userId: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  gmailConnection: PlatformConnection;
  appleCalendarConnection: PlatformConnection;
  googleCalendarConnection: PlatformConnection;
  personalSignature: string | null;
  personalWorkingHours: WorkingHours | null;
  notificationSettings: NotificationSettings;
};

export type UserProfileView = UserProfile & {
  companyName: string | null;
  connectedPlatformLabels: string[];
};
