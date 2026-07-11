import { createImmoScout24Client, type ImmoScout24Client } from "@/features/immoscout24/services/client";
import {
  parseImmoScout24Inquiries,
  parseImmoScout24Inquiry,
} from "@/features/immoscout24/services/parser";
import type {
  ImmoScout24RawInquiry,
  ImmoScout24SyncResult,
  NormalizedImmoScout24Inquiry,
} from "@/features/immoscout24/services/types";

export class IntegrationNotImplementedError extends Error {
  constructor(method: string) {
    super(`[HELPY Connect] immoscout24.${method} ist noch nicht implementiert.`);
    this.name = "IntegrationNotImplementedError";
  }
}

/**
 * ImmoScout24 Service — erste Integration für Immobilienanfragen.
 * Mappt ImmoScout24 API → NormalizedImmoScout24Inquiry.
 */
export class ImmoScout24Service {
  readonly id = "immoscout24" as const;
  readonly displayName = "ImmoScout24.ch";

  private client: ImmoScout24Client;

  constructor(client?: ImmoScout24Client) {
    this.client = client ?? createImmoScout24Client();
  }

  async connect(): Promise<void> {
    throw new IntegrationNotImplementedError("connect");
  }

  async disconnect(): Promise<void> {
    this.client.clearTokens();
  }

  async sync(): Promise<ImmoScout24SyncResult> {
    throw new IntegrationNotImplementedError("sync");
  }

  async getInquiries(): Promise<NormalizedImmoScout24Inquiry[]> {
    throw new IntegrationNotImplementedError("getInquiries");
  }

  async getInquiryById(_id: string): Promise<NormalizedImmoScout24Inquiry | null> {
    throw new IntegrationNotImplementedError("getInquiryById");
  }

  /** Hilfsmethode für Mock-/Parser-Pipeline — noch keine API. */
  normalizeRawInquiries(
    rawItems: ImmoScout24RawInquiry[]
  ): NormalizedImmoScout24Inquiry[] {
    return parseImmoScout24Inquiries(rawItems);
  }

  normalizeRawInquiry(
    raw: ImmoScout24RawInquiry
  ): NormalizedImmoScout24Inquiry {
    return parseImmoScout24Inquiry(raw);
  }
}

export function createImmoScout24Service(): ImmoScout24Service {
  return new ImmoScout24Service();
}
