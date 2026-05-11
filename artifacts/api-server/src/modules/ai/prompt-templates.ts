import type { AiTemplateKey } from "./contracts";

/** Server-side template prefixes — never trust client text as system instructions. */
export const AI_TEMPLATE_PREFIX: Record<AiTemplateKey, string> = {
  explain_concept:
    "Explain the following clearly for a student studying for an exam. Define terms, give a short example, and call out a common misconception:",
  step_by_step:
    "Solve or walk through the following step by step. Number each step and justify brief reasoning:",
  quiz_me:
    "Create 5 practice questions (mix MCQ and short answer) based on the following topic or problem. Provide an answer key after the questions:",
  essay_outline:
    "Produce a structured essay outline (thesis, supporting points, evidence to seek, counterargument) for the following prompt:",
  mnemonic:
    "Suggest 2–3 memorable mnemonics or memory aids (no unsafe content) for remembering the following material:",
};

export function resolveTemplatePrompt(templateKey: AiTemplateKey | undefined, userContent: string): string {
  if (!templateKey) return userContent;
  const prefix = AI_TEMPLATE_PREFIX[templateKey];
  return `${prefix}\n\n---\n\n${userContent}`;
}
