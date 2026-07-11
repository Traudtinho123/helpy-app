export {
  TIMELINE_FILTERS,
  TIMELINE_FILTER_LABELS,
  TIMELINE_STATUS_LABELS,
  TIMELINE_TYPE_CONFIG,
  matchesTimelineFilter,
} from "@/features/customers/services/timeline/config";

export {
  MOCK_CUSTOMER_TIMELINES,
  getTimelineEntryCount,
  getTimelineForCustomer,
} from "@/features/customers/services/timeline/mock-timeline";

export {
  filterTimelineEntries,
  formatTimelineTime,
  groupTimelineByDate,
  sortTimelineEntries,
} from "@/features/customers/services/timeline/utils";

export type {
  TimelineDateGroup,
  TimelineEntry,
  TimelineEntryStatus,
  TimelineEntryType,
  TimelineFilter,
} from "@/features/customers/services/timeline/types";
