export {
  computeMatchScore,
  findMatchingSuchprofile,
  parseFlaeche,
  parsePriceChf,
  parseZimmer,
} from "./services/matching-engine";
export {
  extractSuchprofilFromText,
  isSuchprofilExtractionConfident,
} from "./services/suchprofil-extractor";
export { buildMatchMailDraft } from "./services/match-mail-template";
export { detectSuchprofilFromKundenakte } from "./services/suchprofil-detection-service";
export { triggerObjectMatching } from "./services/matching-trigger";
export {
  buildMatchRecordsForObject,
  summarizeMatchBreakdown,
} from "./services/match-orchestrator";
export type { KundeContactInfo } from "./services/match-orchestrator";
export {
  fetchMatches,
  fetchSuchprofile,
  getMatchesForObject,
  getSuchprofilForKunde,
  getTodayMatches,
  markMatchKontaktiert,
  pushMatchNotification,
  queueSuchprofilExtraction,
  runMatchingForObject,
  saveSuchprofil,
  subscribeMatchingStore,
} from "./services/match-client-store";
export type { PendingSuchprofilExtraction } from "./services/match-client-store";
export type {
  CreateSuchprofilInput,
  ExtractedSuchprofil,
  MatchScoreBreakdown,
  ObjektMatchRecord,
  ObjektMatchWithKunde,
  SuchprofilArt,
  SuchprofilRecord,
  UpdateSuchprofilInput,
} from "./types/matching-types";
export {
  LAGE_SUGGESTIONS,
  MATCH_THRESHOLD,
  OBJEKTTYP_OPTIONS,
} from "./types/matching-types";
