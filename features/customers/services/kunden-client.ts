import type { Customer } from "@/features/customers/mock/mock-customers";
import type { CreateKundeInput } from "@/features/customers/types/kunden-db-types";

export async function fetchKundenCustomers(): Promise<Customer[]> {
  const response = await fetch("/api/kunden", { cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json()) as { customers?: Customer[] };
  return payload.customers ?? [];
}

export async function lookupCustomerByPhone(
  phone: string
): Promise<Customer | null> {
  if (!phone.trim()) return null;
  const response = await fetch(
    `/api/kunden?phone=${encodeURIComponent(phone.trim())}`,
    { cache: "no-store" }
  );
  if (!response.ok) return null;
  const payload = (await response.json()) as { customer?: Customer | null };
  return payload.customer ?? null;
}

export type CreateKundeClientResult =
  | { ok: true; customer: Customer }
  | { ok: false; error: string; duplicateId?: string };

export async function createKundeCustomer(
  input: CreateKundeInput
): Promise<CreateKundeClientResult> {
  const response = await fetch("/api/kunden", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as {
    ok?: boolean;
    customer?: Customer;
    error?: string;
    duplicate?: { id?: string } | null;
  };

  if (!response.ok || !payload.ok || !payload.customer) {
    return {
      ok: false,
      error: payload.error ?? "Kunde konnte nicht angelegt werden.",
      duplicateId: payload.duplicate?.id,
    };
  }

  return { ok: true, customer: payload.customer };
}
