export {
  getBackgroundMemoryWorkspaceHints,
  processBackgroundMemoryEvent,
  processBackgroundMemoryFromGmailBundle,
  subscribeBackgroundMemory,
} from "@/features/memory/services/background-memory-engine";

export {
  getBackgroundMemoryWorkspaceHintsSnapshot,
  getBackgroundMemoryWorkspaceHintsServerSnapshot,
  invalidateBackgroundMemoryWorkspaceSnapshots,
} from "@/features/memory/services/background-memory-workspace";

export type {
  BackgroundMemoryEvent,
  BackgroundMemoryHint,
  BackgroundMemoryWorkspaceContext,
  ObjectMemoryRecord,
} from "@/features/memory/types/memory-types";

export {
  ensureMemoryEngine,
  getCustomerMemoryEntries,
  getCustomerMemorySnapshot,
  getMemoryPanelForVorgang,
  listAllMemories,
} from "@/features/memory/services/memory-engine";

export {
  bootstrapCustomerMemoryFromGmailCache,
  getCustomerMemoryWorkspaceView,
  getHistoryByType,
  ingestGmailVorgangBundle,
  ingestGmailVorgangBundles,
  ingestWorkspaceVorgang,
  resolveCustomerProfileForVorgang,
  subscribeCustomerMemory,
} from "@/features/memory/services/memory-v2-engine";

export {
  applyCrmToVorgangKunde,
  getAllCrmCustomersForList,
  getCrmWorkspaceView,
  resolveCrmCustomerForVorgang,
  subscribeCrm,
  syncCrmFromGmailBundles,
} from "@/features/crm/services";

export {
  buildMemoryEnrichmentHints,
  buildMemoryPanelBullets,
} from "@/features/memory/services/customer-memory-enrichment";

export {
  buildCustomerIdFromEmail,
  clearCustomerMemoryStore,
  getAllCustomerProfiles,
  getCustomerProfile,
  getCustomerProfileByEmail,
  upsertCustomerProfile,
} from "@/features/memory/services/customer-memory-store";

export type {
  CustomerMemoryContact,
  CustomerMemoryHistoryItem,
  CustomerMemoryHistoryType,
  CustomerMemoryProfile,
  CustomerMemoryWorkspaceView,
  MemoryEnrichmentHint,
} from "@/features/memory/types/customer-memory-types";

export {
  forgetMemory,
  getAllMemories,
  getMemoriesByCustomer,
  getMemoriesBySkill,
  getUserMemories,
  initMemoryStore,
  upsertMemory,
} from "@/features/memory/services/memory-store";

export {
  formatMemoryBullet,
  MEMORY_INTRO_CUSTOMER,
  MEMORY_INTRO_PANEL,
  MEMORY_SOURCE_LABELS,
  selectPanelMemories,
  sortMemoriesByRelevance,
} from "@/features/memory/services/memory-rules";

export {
  getAllMockMemories,
  getSkillMemories,
  MOCK_CUSTOMER_MEMORIES,
  MOCK_SKILL_MEMORIES,
  MOCK_USER_MEMORIES,
  resolveCustomerIdForVorgang,
  VORGANG_CUSTOMER_MAP,
} from "@/features/memory/services/mock-memory";

export type {
  MemoryContext,
  MemoryEntry,
  MemoryPanelResult,
  MemoryScope,
  MemorySnapshot,
  MemorySource,
} from "@/features/memory/services/types";
