"use strict";

import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";

const CONFIG_FILE = path.resolve(config.paths.data, "models_config.json");

export const PROVIDERS = {
  nvidia: {
    id: "nvidia",
    name: "NVIDIA NIM",
    defaultBaseUrl: "https://integrate.api.nvidia.com/v1",
    envKey: "NVIDIA_API_KEY",
    description: "High-performance enterprise NIM microservices",
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    defaultBaseUrl: "https://api.openai.com/v1",
    envKey: "OPENAI_API_KEY",
    description: "OpenAI GPT-4o, o1, and reasoning models",
  },
  groq: {
    id: "groq",
    name: "Groq",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    envKey: "GROQ_API_KEY",
    description: "Ultra-fast low-latency LPU inference",
  },
  ollama: {
    id: "ollama",
    name: "Local Ollama",
    defaultBaseUrl: "http://localhost:11434/v1",
    envKey: null,
    description: "100% private offline local models",
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    envKey: "OPENROUTER_API_KEY",
    description: "Universal API gateway for all open & proprietary models",
  },
  custom: {
    id: "custom",
    name: "Custom / Self-Hosted",
    defaultBaseUrl: "",
    envKey: null,
    description: "vLLM, TGI, LM Studio, or custom OpenAI-compatible server",
  },
};

export const DEFAULT_MODELS = [
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b",
    name: "Nemotron 550B",
    provider: "nvidia",
    description: "NVIDIA Ultra Reasoning (Default)",
    isDefault: true,
  },
  {
    id: "nvidia/nemotron-4-340b-instruct",
    name: "Nemotron 340B",
    provider: "nvidia",
    description: "Fast Agentic NIM",
  },
  {
    id: "nvidia/nemotron-3.5-super-vl-120b-a12b",
    name: "Nemotron 3.5 Super VL",
    provider: "nvidia",
    description: "120B Vision-Language Reasoning",
  },
  {
    id: "meta/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "nvidia",
    description: "Meta Frontier Intelligence",
  },
  {
    id: "mistralai/mistral-large-2-instruct",
    name: "Mistral Large 2",
    provider: "nvidia",
    description: "123B Parameter Frontier",
  },
  {
    id: "deepseek-ai/deepseek-r1",
    name: "DeepSeek R1",
    provider: "nvidia",
    description: "Open-R1 High Accuracy",
  },
  {
    id: "deepseek-ai/deepseek-v4.1-flash",
    name: "DeepSeek V4.1 Flash",
    provider: "nvidia",
    description: "Ultra Fast High-Throughput Reasoning",
  },
];

class ModelRegistry {
  constructor() {
    this.models = [];
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.models)) {
          // Merge defaults with custom models (avoid duplicates by id)
          const customIds = new Set(parsed.models.map((m) => m.id));
          const missingDefaults = DEFAULT_MODELS.filter((d) => !customIds.has(d.id));
          this.models = [...missingDefaults, ...parsed.models];
          return;
        }
      }
    } catch (err) {
      logger.warn(`[ModelRegistry] Failed to load ${CONFIG_FILE}: ${err.message}. Using default models.`);
    }

    this.models = [...DEFAULT_MODELS];
    this.save();
  }

  save() {
    try {
      const data = {
        updatedAt: new Date().toISOString(),
        models: this.models,
      };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      logger.error(`[ModelRegistry] Failed to save models configuration: ${err.message}`);
    }
  }

  getProviders() {
    return Object.values(PROVIDERS).map((p) => {
      const envVal = p.envKey ? process.env[p.envKey] : null;
      return {
        ...p,
        isConfigured: Boolean(envVal || p.id === "ollama"),
      };
    });
  }

  getModels() {
    return this.models;
  }

  getModel(modelId) {
    if (!modelId) return null;
    return this.models.find((m) => m.id === modelId) || null;
  }

  getProviderForModel(modelId) {
    const model = this.getModel(modelId);
    if (model && model.provider && PROVIDERS[model.provider]) {
      return PROVIDERS[model.provider];
    }

    // Heuristic provider detection if unlisted
    const lower = String(modelId).toLowerCase();
    if (lower.startsWith("nvidia/") || lower.startsWith("meta/") || lower.startsWith("mistralai/") || lower.startsWith("deepseek-ai/")) {
      return PROVIDERS.nvidia;
    }
    if (lower.startsWith("gpt-") || lower.startsWith("o1") || lower.startsWith("o3")) {
      return PROVIDERS.openai;
    }
    if (lower.includes("groq")) {
      return PROVIDERS.groq;
    }

    return PROVIDERS.nvidia; // Fallback to primary configured textBaseUrl
  }

  getEndpointConfig(modelId) {
    const model = this.getModel(modelId);
    const provider = this.getProviderForModel(modelId);

    // Custom model overrides
    if (model && model.baseURL) {
      return {
        baseURL: model.baseURL,
        apiKey: model.apiKey || (provider.envKey ? process.env[provider.envKey] : "") || config.llm.textApiKey,
        provider: provider.id,
      };
    }

    let apiKey = "";
    if (provider.envKey && process.env[provider.envKey]) {
      apiKey = process.env[provider.envKey];
    } else if (provider.id === "nvidia") {
      apiKey = config.llm.textApiKey || process.env.NVIDIA_API_KEY || "";
    } else if (provider.id === "openai") {
      apiKey = process.env.OPENAI_API_KEY || config.llm.textApiKey || "";
    } else if (provider.id === "ollama") {
      apiKey = "ollama";
    }

    const baseURL = provider.defaultBaseUrl || config.llm.textBaseUrl;

    return {
      baseURL,
      apiKey: apiKey || config.llm.textApiKey,
      provider: provider.id,
    };
  }

  addModel({ id, name, provider = "nvidia", description = "", baseURL = null, apiKey = null }) {
    if (!id || typeof id !== "string") {
      throw new Error("Model ID is required");
    }
    const cleanId = id.trim();
    const cleanName = (name || cleanId).trim();

    // Check if model already exists
    const existingIndex = this.models.findIndex((m) => m.id === cleanId);
    const newEntry = {
      id: cleanId,
      name: cleanName,
      provider: provider || "custom",
      description: description || `${PROVIDERS[provider]?.name || "Custom"} Model`,
      ...(baseURL ? { baseURL: baseURL.trim() } : {}),
      ...(apiKey ? { apiKey: apiKey.trim() } : {}),
      custom: true,
      addedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.models[existingIndex] = { ...this.models[existingIndex], ...newEntry };
    } else {
      this.models.push(newEntry);
    }

    this.save();
    logger.info(`[ModelRegistry] Added/Updated model: "${cleanName}" (${cleanId}) [Provider: ${provider}]`);
    return newEntry;
  }

  removeModel(modelId) {
    const countBefore = this.models.length;
    this.models = this.models.filter((m) => m.id !== modelId);
    if (this.models.length !== countBefore) {
      this.save();
      logger.info(`[ModelRegistry] Removed model: "${modelId}"`);
      return true;
    }
    return false;
  }
}

export const modelRegistry = new ModelRegistry();
