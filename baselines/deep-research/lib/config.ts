export const CONFIG = {
  // Rate limits (requests per minute)
  rateLimits: {
    enabled: false, // Flag to enable/disable rate limiting
    search: 10,
    contentFetch: 20,
    reportGeneration: 5,
    agentOptimizations: 10,
  },

  // Search settings
  search: {
    resultsPerPage: 10,
    maxSelectableResults: 3,
    provider: 'google' as 'google' | 'bing' | 'exa', // Default search provider
    safeSearch: {
      google: 'off' as 'active' | 'off',
      bing: 'off' as 'moderate' | 'strict' | 'off',
    },
    market: 'en-US',
  },

  // AI Platform settings
  platforms: {
    google: {
      enabled: false,
      models: {
        'gemini-flash': {
          enabled: false,
          label: 'Gemini Flash',
        },
        'gemini-flash-thinking': {
          enabled: false,
          label: 'Gemini Flash Thinking',
        },
        'gemini-exp': {
          enabled: false,
          label: 'Gemini Exp',
        },
      },
    },
    ollama: {
      enabled: false,
      models: {
        'deepseek-r1:1.5b': {
          enabled: false,
          label: 'DeepSeek R1 1.5B',
        },
      },
    },
    openai: {
      enabled: true,
      models: {
        'gpt-4o-2024-11-20': {
          enabled: true,
          label: 'GPT-4o',
        },
        'o1-mini': {
          enabled: true,
          label: 'o1-mini',
        },
        o1: {
          enabled: true,
          label: 'o1',
        },
      },
    },
    anthropic: {
      enabled: false,
      models: {
        'claude-3-7-sonnet-latest': {
          enabled: false,
          label: 'Claude 3.7 Sonnet',
        },
        'claude-3-5-haiku-latest': {
          enabled: false,
          label: 'Claude 3.5 Haiku',
        },
      },
    },
    deepseek: {
      enabled: false,
      models: {
        chat: {
          enabled: false,
          label: 'Chat',
        },
        reasoner: {
          enabled: false,
          label: 'Reasoner',
        },
      },
    },
    openrouter: {
      enabled: false,
      models: {
        'openrouter/auto': {
          enabled: false,
          label: 'Auto',
        },
      },
    },
  },
} as const
