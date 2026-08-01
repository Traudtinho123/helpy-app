export type HelpyChatSurface =
  | "dashboard"
  | "workday"
  | "workspace"
  | "gmail-workspace";

export type HelpyChatContext = {
  surface: HelpyChatSurface;
  vorgangId?: string;
  vorgangTitle?: string;
  vorgangSummary?: string;
  skill?: string;
  workdayHint?: string;
};

export type HelpyChatRole = "user" | "assistant";

export type HelpyChatMessage = {
  id: string;
  role: HelpyChatRole;
  content: string;
  createdAt: string;
};

export type HelpyChatRequest = {
  message: string;
  history?: Array<{ role: HelpyChatRole; content: string }>;
  context?: HelpyChatContext;
};

export type HelpyChatResponse = {
  reply: string;
  source: "gpt" | "local";
};
