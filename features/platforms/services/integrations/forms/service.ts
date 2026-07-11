import {
  IntegrationNotImplementedError,
  type FormProvider,
} from "@/features/platforms/services/integrations/provider";
import type { FormQueryOptions, FormSubmission } from "@/features/platforms/services/integrations/types";

/**
 * Formular-Provider — Website, Typeform, HubSpot etc. (geplant).
 */
export class FormsService implements FormProvider {
  readonly id = "forms" as const;
  readonly displayName = "Formular-Eingänge";

  async getSubmissions(_options?: FormQueryOptions): Promise<FormSubmission[]> {
    throw new IntegrationNotImplementedError(this.id, "getSubmissions");
  }
}

export function createFormsService(): FormsService {
  return new FormsService();
}
