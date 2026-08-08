import type { ClassifiedIntent } from './types';

const INFOSEEK_PATTERN = /\b(compare|summarize|summary|theory|theories|list|research|explain)\b/i;
const COMMAND_PATTERN = /\b(show|open|filter|display|run|load)\b/i;
const ANALYSIS_PATTERN = /\b(why|analyze|analyse|diverge|divergence|cause|reason)\b/i;

export function classifyIntent(text: string): ClassifiedIntent {
  const raw = text.trim();

  if (ANALYSIS_PATTERN.test(raw)) {
    return { class: 'analysis', raw, analysisNeedsDialogue: true };
  }

  if (COMMAND_PATTERN.test(raw)) {
    return { class: 'command', raw, analysisNeedsDialogue: false };
  }

  if (INFOSEEK_PATTERN.test(raw)) {
    return { class: 'infoseek', raw, analysisNeedsDialogue: false };
  }

  return { class: 'infoseek', raw, analysisNeedsDialogue: false };
}
