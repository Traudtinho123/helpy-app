/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CompletedVorgangRecord } from "@/features/workspace/services/vorgaenge/completed-vorgaenge-types";

const COMPANY_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

type QueryResult = { data: unknown; error: { message?: string; code?: string } | null };

function createQueryChain(finalResult: QueryResult) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(async () => finalResult);
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  return chain;
}

const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/typed-client", () => ({
  createTypedClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

import {
  fetchCompletedVorgaengeFromSupabase,
  isCompletedVorgaengeCompanyId,
  resetCompletedVorgaengeSupabaseWarningsForTests,
  resolveAuthenticatedCompanyId,
  upsertCompletedVorgangToSupabase,
} from "@/features/workspace/services/vorgaenge/completed-vorgaenge-supabase";

function buildRecord(
  overrides: Partial<CompletedVorgangRecord> = {}
): CompletedVorgangRecord {
  return {
    companyId: COMPANY_ID,
    workspaceId: "brain-v3-msg-001",
    provider: "gmail",
    providerThreadId: "thread-abc",
    providerMessageId: "msg-001",
    caseId: "gmail:thread:thread-abc",
    vorgangId: "brain-v3-msg-001",
    gmailThreadId: "thread-abc",
    gmailMessageIds: ["msg-001"],
    status: "Erledigt",
    completedAt: "2026-07-01T12:00:00.000Z",
    completedBy: USER_ID,
    completedByUserId: USER_ID,
    lastKnownIncomingMessageAt: "2026-07-01T10:00:00.000Z",
    lastKnownOutgoingMessageAt: null,
    latestMessageAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T12:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  resetCompletedVorgaengeSupabaseWarningsForTests();
  mockGetUser.mockResolvedValue({
    data: { user: { id: USER_ID } },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("completed-vorgaenge-supabase", () => {
  it("isCompletedVorgaengeCompanyId erkennt gültige UUIDs", () => {
    expect(isCompletedVorgaengeCompanyId(COMPANY_ID)).toBe(true);
    expect(isCompletedVorgaengeCompanyId("helpy-demo-company")).toBe(false);
    expect(isCompletedVorgaengeCompanyId("")).toBe(false);
  });

  it("resolveAuthenticatedCompanyId liest company_id aus profiles", async () => {
    const profilesChain = createQueryChain({
      data: { company_id: COMPANY_ID },
      error: null,
    });
    mockFrom.mockReturnValue(profilesChain);

    await expect(resolveAuthenticatedCompanyId()).resolves.toBe(COMPANY_ID);
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(profilesChain.eq).toHaveBeenCalledWith("id", USER_ID);
  });

  it("fetchCompletedVorgaengeFromSupabase filtert nach company_id statt user_id", async () => {
    const row = {
      id: "33333333-3333-4333-8333-333333333333",
      user_id: USER_ID,
      company_id: COMPANY_ID,
      provider: "gmail",
      provider_thread_id: "thread-abc",
      provider_message_id: "msg-001",
      case_id: "gmail:thread:thread-abc",
      vorgang_id: "brain-v3-msg-001",
      status: "erledigt",
      completed_at: "2026-07-01T12:00:00.000Z",
      completed_by: USER_ID,
      last_known_incoming_message_at: "2026-07-01T10:00:00.000Z",
      last_known_outgoing_message_at: null,
      created_at: "2026-07-01T12:00:00.000Z",
      updated_at: "2026-07-01T12:00:00.000Z",
    };

    const chain = {
      select: vi.fn(function select() {
        return chain;
      }),
      eq: vi.fn(function eq(column: string, value: string) {
        if (column === "company_id") {
          expect(value).toBe(COMPANY_ID);
        }
        if (column === "status") {
          expect(value).toBe("erledigt");
        }
        return chain;
      }),
    };

    Object.assign(chain, {
      then(onFulfilled: (value: QueryResult) => unknown) {
        return Promise.resolve(onFulfilled({ data: [row], error: null }));
      },
    });

    mockFrom.mockReturnValue(chain);

    const result = await fetchCompletedVorgaengeFromSupabase(COMPANY_ID);

    expect(result.ok).toBe(true);
    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.companyId).toBe(COMPANY_ID);
    expect(chain.eq).toHaveBeenCalledWith("company_id", COMPANY_ID);
    expect(chain.eq).not.toHaveBeenCalledWith("user_id", expect.anything());
  });

  it("upsertCompletedVorgangToSupabase nutzt company_id für Lookup und Insert", async () => {
    const insertedPayloads: Record<string, unknown>[] = [];
    const findChain = createQueryChain({ data: null, error: null });
    const insertChain = {
      select: vi.fn(function select() {
        return insertChain;
      }),
      maybeSingle: vi.fn(async () => ({
        data: {
          id: "44444444-4444-4444-8444-444444444444",
          user_id: USER_ID,
          company_id: COMPANY_ID,
          provider: "gmail",
          provider_thread_id: "thread-abc",
          provider_message_id: "msg-001",
          case_id: "gmail:thread:thread-abc",
          vorgang_id: "brain-v3-msg-001",
          status: "erledigt",
          completed_at: "2026-07-01T12:00:00.000Z",
          completed_by: USER_ID,
          last_known_incoming_message_at: "2026-07-01T10:00:00.000Z",
          last_known_outgoing_message_at: null,
          created_at: "2026-07-01T12:00:00.000Z",
          updated_at: "2026-07-01T12:00:00.000Z",
        },
        error: null,
      })),
      insert: vi.fn((payload: Record<string, unknown>) => {
        insertedPayloads.push(payload);
        return insertChain;
      }),
    };

    mockFrom
      .mockReturnValueOnce(findChain)
      .mockReturnValueOnce(findChain)
      .mockReturnValueOnce(insertChain);

    const record = buildRecord({ companyId: "helpy-demo-company" });
    const remote = await upsertCompletedVorgangToSupabase(record, USER_ID, COMPANY_ID);

    expect(remote?.companyId).toBe(COMPANY_ID);
    expect(insertedPayloads[0]?.company_id).toBe(COMPANY_ID);
    expect(insertedPayloads[0]?.user_id).toBe(USER_ID);
    expect(findChain.eq).toHaveBeenCalledWith("company_id", COMPANY_ID);
  });

  it("upsertCompletedVorgangToSupabase überspringt Mock-companyIds ohne UUID", async () => {
    const record = buildRecord({ companyId: "helpy-demo-company" });
    const remote = await upsertCompletedVorgangToSupabase(record, USER_ID);
    expect(remote).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
