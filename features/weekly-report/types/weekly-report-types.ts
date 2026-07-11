export type WeeklyReportTrend = "up" | "down" | "flat";

export type WeeklyReportMetric = {
  id: string;
  label: string;
  current: number;
  previous: number;
  trend: WeeklyReportTrend;
  changeLabel: string;
};

export type WeeklyReportStaleItem = {
  vorgangId: string;
  kundeName: string;
  daysWaiting: number;
};

export type WeeklyReportRecommendation = {
  text: string;
};

export type WeeklyReportData = {
  weekKey: string;
  weekNumber: number;
  weekLabel: string;
  companyName: string;
  recipientName: string | null;
  isLowActivity: boolean;
  metrics: WeeklyReportMetric[];
  staleWaiting: WeeklyReportStaleItem[];
  openTotal: number;
  recommendations: WeeklyReportRecommendation[];
  vorgaengeUrl: string;
  settingsUrl: string;
};
