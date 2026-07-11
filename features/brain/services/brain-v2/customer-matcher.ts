import { mockCustomers } from "@/features/customers/mock/mock-customers";
import type { ConnectEvent } from "@/features/platforms/services/connect/connector-types";
import type { CustomerMatch } from "@/features/brain/services/brain-v2/types";

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-zäöüß0-9\s&.-]/g, " ");
}

function extractSearchTerms(event: ConnectEvent): string[] {
  const parts = [
    event.customer,
    event.title,
    String(event.payload.absender ?? ""),
    String(event.payload.email ?? ""),
    String(event.payload.telefon ?? ""),
  ];
  return parts.filter(Boolean);
}

export function matchCustomer(event: ConnectEvent): CustomerMatch {
  const terms = extractSearchTerms(event).map(normalize).join(" ");

  for (const customer of mockCustomers) {
    const companyNorm = normalize(customer.company);
    const personNorm = normalize(customer.contactPerson);
    const emailNorm = normalize(customer.email);

    if (
      terms.includes(companyNorm) ||
      terms.includes(personNorm) ||
      terms.includes(emailNorm.split("@")[0] ?? "")
    ) {
      return {
        type:
          customer.status === "neu" || customer.status === "interessent"
            ? "neuer_kunde"
            : "bestandskunde",
        customerId: customer.id,
        customerName: customer.contactPerson,
        companyName: customer.company,
      };
    }
  }

  const customerField = event.customer.trim();

  if (
    customerField.toLowerCase().includes("unbekannt") ||
    customerField.toLowerCase().includes("intern")
  ) {
    return {
      type: "unbekannt",
      customerName: customerField || "Unbekannter Absender",
    };
  }

  if (
    customerField.includes("Familie") ||
    customerField.includes("AG") ||
    customerField.includes("GmbH") ||
    customerField.includes("·")
  ) {
    const name = customerField.split("·")[0]?.trim() ?? customerField;
    return {
      type: "neuer_kunde",
      customerName: name,
      companyName: customerField.includes("·")
        ? customerField.split("·")[1]?.trim()
        : undefined,
    };
  }

  return {
    type: "neuer_kunde",
    customerName: customerField,
  };
}
