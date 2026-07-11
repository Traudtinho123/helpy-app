export type {
  NotificationSettings,
  PlatformConnection,
  UserProfile,
  UserProfileView,
  UserRole,
  WorkingHours,
} from "@/lib/user/types/user-profile-types";

export {
  getUserConnectedPlatformLabels,
  getUserPersonalPlatformConnections,
  getUserProfile,
  getUserProfileServerSnapshot,
  getUserProfileSnapshot,
  getUserProfileVersion,
  getUserProfileView,
  hydrateUserProfileFromAuth,
  reconcileUserPlatformConnections,
  resetUserProfile,
  subscribeUserProfile,
  updateUserProfile,
} from "@/lib/user/services/user-profile-service";

export {
  useUserProfile,
  useUserProfileContext,
  UserProfileProvider,
} from "@/lib/user/components/user-profile-context";

export { getPlatformLabel, PLATFORM_LABELS } from "@/lib/user/platform-labels";

export { MOCK_USER_PROFILE } from "@/lib/user/mock/user-profile-mock";
