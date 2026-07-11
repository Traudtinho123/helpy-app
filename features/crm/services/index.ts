export {
  applyCrmToVorgangKunde,
  bootstrapCrmFromGmailCache,
  crmCustomerToMemoryProfile,
  getAllCrmCustomersForList,
  getCrmWorkspaceView,
  resolveCrmCustomerForVorgang,
  subscribeCrm,
  syncCrmFromGmailBundle,
  syncCrmFromGmailBundles,
  syncCrmFromWorkspaceVorgang,
} from "@/features/crm/services/crm-engine";

export {
  findCrmCustomerByMatch,
  getAllCrmCustomers,
  getCrmCustomer,
  upsertCrmCustomer,
} from "@/features/crm/services/crm-store";

export {
  buildCrmCustomerId,
  findMatchingCustomer,
  mergeCrmCustomers,
  normalizeEmail,
} from "@/features/crm/services/crm-merge";

export type {
  CrmCustomerStatus,
  CrmDocument,
  CrmProject,
  CrmTimelineEntry,
  CrmTimelineType,
  CrmWorkspaceView,
  HelpyCrmCustomer,
} from "@/features/crm/types/crm-types";
