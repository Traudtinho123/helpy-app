import { createImmoScout24Client, type ImmoScout24Client } from "@/features/immoscout24/services/client";
import type { ImmoScout24SyncResult } from "@/features/immoscout24/services/types";

export type ImmoScout24ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "syncing"
  | "error";

export type ImmoScout24Connection = {
  status: ImmoScout24ConnectionStatus;
  accountLabel?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  errorMessage?: string;
};

/**
 * ImmoScout24 Connector — Verbindungsmanagement.
 * Noch ohne echte API-Anbindung.
 */
export class ImmoScout24Connector {
  private connection: ImmoScout24Connection = { status: "disconnected" };
  private client: ImmoScout24Client;

  constructor(client?: ImmoScout24Client) {
    this.client = client ?? createImmoScout24Client();
  }

  getConnection(): ImmoScout24Connection {
    return { ...this.connection };
  }

  async connect(): Promise<void> {
    this.connection = { status: "connecting" };
    throw new Error(
      "[HELPY Connect] immoscout24.connect ist noch nicht implementiert."
    );
  }

  async disconnect(): Promise<void> {
    this.client.clearTokens();
    this.connection = { status: "disconnected" };
  }

  async sync(): Promise<ImmoScout24SyncResult> {
    this.connection = { ...this.connection, status: "syncing" };
    throw new Error(
      "[HELPY Connect] immoscout24.sync ist noch nicht implementiert."
    );
  }
}

export function createImmoScout24Connector(): ImmoScout24Connector {
  return new ImmoScout24Connector();
}
