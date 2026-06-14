import { AIProvider } from './types';
import { mockLlamaProvider } from './providers/mockLlamaProvider';

export type { AIProvider, ShiftSummaryContext } from './types';

/**
 * Returns the configured AI provider.
 * Set AI_PROVIDER=llama in .env when a real provider is integrated.
 */
export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? 'mock';

  switch (provider) {
    case 'mock':
    default:
      return mockLlamaProvider;
    // case 'llama':
    //   return llamaProvider;
  }
}
