import { describe, expect, it } from "vitest";
import { createEmptyCompanyKnowledge } from "@/features/company-knowledge/services/company-knowledge-defaults";
import { validateCompanyKnowledge } from "@/features/company-knowledge/services/company-knowledge-validator";

describe("company knowledge validator", () => {
  it("akzeptiert leeres aber gültiges Wissen", () => {
    const knowledge = createEmptyCompanyKnowledge("company-1");
    expect(validateCompanyKnowledge(knowledge)).toEqual({ ok: true });
  });

  it("verlangt Text für individuellen Antwortstil", () => {
    const knowledge = createEmptyCompanyKnowledge("company-1");
    knowledge.replyStyle = "custom";
    const result = validateCompanyKnowledge(knowledge);
    expect(result.ok).toBe(false);
  });
});
