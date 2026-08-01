export type SocialPlatform = "instagram" | "facebook" | "linkedin";

export type SocialPostStatus = "draft" | "scheduled" | "published" | "failed";

export type SocialPostEngagement = {
  likes?: number;
  comments?: number;
  shares?: number;
  reactions?: number;
  interactions?: number;
};

export type SocialPost = {
  id: string;
  companyId: string;
  objektId: string;
  platform: SocialPlatform;
  textContent: string | null;
  hashtags: string[];
  imageUrl: string | null;
  status: SocialPostStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  platformPostId: string | null;
  engagement: SocialPostEngagement;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SocialConnectionPlatform = SocialPlatform | "meta";

export type SocialConnection = {
  id: string;
  companyId: string;
  platform: SocialConnectionPlatform;
  pageId: string | null;
  pageName: string | null;
  instagramId: string | null;
  linkedinOrgId: string | null;
  tokenExpiresAt: string | null;
  connectedAt: string;
  updatedAt: string;
  connected: boolean;
};

export type SocialConnectionPublic = Omit<SocialConnection, "connected"> & {
  connected: boolean;
};

export type GeneratedSocialPosts = Record<SocialPlatform, string>;

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
};

export const SOCIAL_PLATFORM_EMOJI: Record<SocialPlatform, string> = {
  instagram: "📸",
  facebook: "👍",
  linkedin: "💼",
};

export const SOCIAL_POST_CHAR_LIMITS: Record<SocialPlatform, number> = {
  instagram: 2200,
  facebook: 500,
  linkedin: 700,
};

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  "instagram",
  "facebook",
  "linkedin",
];
