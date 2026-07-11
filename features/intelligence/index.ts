export type {
  CustomerMemory,
  CustomerMemoryUpdateInput,
  CustomerMemoryUpdateResult,
  CustomerMemoryUpdateSource,
  CustomerPreferredContact,
  IntelligencePanelView,
} from "@/features/intelligence/types/intelligence-types";

export {
  buildCustomerIdFromEmail,
  clearIntelligenceCustomerMemoryStore,
  getAllIntelligenceCustomerMemories,
  getIntelligenceCustomerMemory,
  subscribeIntelligenceCustomerMemory,
  upsertIntelligenceCustomerMemory,
} from "@/features/intelligence/customer-memory/customer-memory-store";

export { seedMockCustomerMemories } from "@/features/intelligence/customer-memory/mock-customer-memory";

export { extractCustomerKnowledgeFromText } from "@/features/intelligence/knowledge-engine/knowledge-extractor";
export type { ExtractedCustomerKnowledge } from "@/features/intelligence/knowledge-engine/knowledge-extractor";

export {
  buildCustomerIdFromEmail as buildIntelligenceCustomerId,
  buildIntelligencePanelBullets,
  getCustomerMemoryByEmail,
  getIntelligencePanelViewForEmail,
  subscribeIntelligenceCustomerMemory as subscribeCustomerIntelligenceMemory,
  updateCustomerMemory,
} from "@/features/intelligence/memory-engine/memory-engine";

export {
  updateCustomerMemoryFromAppointment,
  updateCustomerMemoryFromGmailBundle,
  updateCustomerMemoryFromGmailBundles,
  updateCustomerMemoryFromKundenakte,
  updateCustomerMemoryFromOffer,
} from "@/features/intelligence/memory-engine/memory-triggers";
