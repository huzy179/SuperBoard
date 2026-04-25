import { AI_CLIENT_CONFIG, type AiFallbackKey } from './ai-client.config';

export type SummarizeFallback = typeof AI_CLIENT_CONFIG.fallbacks.summarize;
export type BriefingFallback = typeof AI_CLIENT_CONFIG.fallbacks.briefing;
export type SuggestLabelsFallback = typeof AI_CLIENT_CONFIG.fallbacks.suggestLabels;
export type EmbeddingsFallback = typeof AI_CLIENT_CONFIG.fallbacks.embeddings;

export type AiFallbackResult<K extends AiFallbackKey> = (typeof AI_CLIENT_CONFIG.fallbacks)[K];

export function getAiFallback<K extends AiFallbackKey>(useCase: K): AiFallbackResult<K> {
  return AI_CLIENT_CONFIG.fallbacks[useCase];
}
