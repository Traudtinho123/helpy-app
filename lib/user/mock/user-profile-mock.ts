import type { UserProfile } from "@/lib/user/types/user-profile-types";

export const MOCK_USER_PROFILE: UserProfile = {
  userId: "user-martina-traudt",
  companyId: "helpy-demo-company",
  name: "Martina Traut",
  email: "martinasimova94@gmail.com",
  role: "owner",
  avatarUrl: null,
  gmailConnection: {
    platformId: "gmail",
    connected: true,
    accountEmail: "martinasimova94@gmail.com",
    lastSync: "vor 2 Minuten",
  },
  appleCalendarConnection: {
    platformId: "apple-calendar",
    connected: false,
    accountEmail: null,
    lastSync: null,
  },
  googleCalendarConnection: {
    platformId: "google-calendar",
    connected: true,
    accountEmail: "martinasimova94@gmail.com",
    lastSync: "vor 15 Minuten",
  },
  personalSignature: null,
  personalWorkingHours: null,
  notificationSettings: {
    email: true,
    push: true,
    digest: false,
  },
};
