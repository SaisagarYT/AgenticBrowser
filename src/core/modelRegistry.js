"use strict";

import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";

const CONFIG_FILE = path.resolve(config.paths.data, "models_config.json");

export const PROVIDERS = {
  openai: {
    id: "openai",
    name: "OpenAI",
    defaultBaseUrl: "https://api.openai.com/v1",
    envKey: "OPENAI_API_KEY",
    description: "GPT-4o, GPT-4o Mini, o1, and o3-mini",
    color: "#22c55e",
    presetModels: [
      { id: "gpt-4o", name: "GPT-4o", tags: ["Omnimodal", "Top Choice"] },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", tags: ["Fast", "Lightweight"] },
      { id: "o1", name: "OpenAI o1", tags: ["High Reasoning"] },
      { id: "o3-mini", name: "OpenAI o3-mini", tags: ["Fast Reasoning"] },
    ],
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic Claude",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    envKey: "ANTHROPIC_API_KEY",
    description: "Claude 3.7 Sonnet, Claude 3.5 Sonnet & Haiku",
    color: "#f59e0b",
    presetModels: [
      { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", tags: ["Hybrid Reasoning", "Top Choice"] },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", tags: ["Fast", "Accurate"] },
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", tags: ["Ultra Fast"] },
    ],
  },
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    envKey: "GEMINI_API_KEY",
    description: "Gemini 2.5 Pro and Gemini 2.5 Flash",
    color: "#3b82f6",
    presetModels: [
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", tags: ["Deep Context", "Multimodal"] },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tags: ["Ultra Fast", "Vision"] },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", tags: ["Balanced"] },
    ],
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    envKey: "DEEPSEEK_API_KEY",
    description: "DeepSeek V3 and DeepSeek R1 Reasoning",
    color: "#a855f7",
    presetModels: [
      { id: "deepseek-chat", name: "DeepSeek V3", tags: ["Top Coding", "Fast"] },
      { id: "deepseek-reasoner", name: "DeepSeek R1", tags: ["Deep Reasoning"] },
    ],
  },
  groq: {
    id: "groq",
    name: "Groq",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    envKey: "GROQ_API_KEY",
    description: "Ultra-fast low-latency LPU inference",
    color: "#f97316",
    presetModels: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", tags: ["Ultra Fast LPU"] },
      { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 70B", tags: ["Reasoning", "Fast"] },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", tags: ["Fast"] },
    ],
  },
  ollama: {
    id: "ollama",
    name: "Local Ollama",
    defaultBaseUrl: "http://localhost:11434/v1",
    envKey: null,
    description: "100% private offline local models",
    color: "#06b6d4",
    presetModels: [
      { id: "llama3.3", name: "Llama 3.3 (Local)", tags: ["100% Private"] },
      { id: "qwen2.5", name: "Qwen 2.5 (Local)", tags: ["Fast Offline"] },
      { id: "deepseek-r1", name: "DeepSeek R1 (Local)", tags: ["Offline Reasoning"] },
    ],
  },
  nvidia: {
    id: "nvidia",
    name: "NVIDIA NIM",
    defaultBaseUrl: "https://integrate.api.nvidia.com/v1",
    envKey: "NVIDIA_API_KEY",
    description: "High-performance enterprise NIM microservices",
    color: "#76b900",
    presetModels: [
      { id: "meta/llama-3.3-70b-instruct", name: "Llama 3.3 70B (NIM)", tags: ["Enterprise NIM"] },
      { id: "deepseek-ai/deepseek-r1", name: "DeepSeek R1 (NIM)", tags: ["NIM Reasoning"] },
    ],
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    envKey: "OPENROUTER_API_KEY",
    description: "Universal gateway for 100+ AI models",
    color: "#ec4899",
    presetModels: [
      { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (OpenRouter)", tags: ["Universal"] },
      { id: "openai/gpt-4o", name: "GPT-4o (OpenRouter)", tags: ["Universal"] },
      { id: "deepseek/deepseek-r1", name: "DeepSeek R1 (OpenRouter)", tags: ["Universal"] },
    ],
  },
  antigravity: {
    id: "antigravity",
    name: "Antigravity CLI Agent",
    defaultBaseUrl: null,
    envKey: null,
    description: "Local autonomous CLI agent with MCP browser tools",
    color: "#eab308",
    presetModels: [
      { id: "antigravity", name: "Antigravity CLI Agent", tags: ["Local MCP Agent", "Autonomous"] },
    ],
  },
  custom: {
    id: "custom",
    name: "Custom / Self-Hosted",
    defaultBaseUrl: "",
    envKey: null,
    description: "vLLM, TGI, LM Studio, or custom OpenAI-compatible server",
    color: "#71717a",
    presetModels: [],
  },
};

export const DEFAULT_MODELS = [];

class ModelRegistry {
  constructor() {
    this.models = [];
    this.providerConfigs = {};
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.models)) {
          this.models = [...parsed.models];
        }
        if (parsed.providerConfigs && typeof parsed.providerConfigs === "object") {
          this.providerConfigs = { ...parsed.providerConfigs };
        }
        return;
      }
    } catch (err) {
      logger.warn(`[ModelRegistry] Failed to load ${CONFIG_FILE}: ${err.message}. Starting empty.`);
    }

    this.models = [];
    this.providerConfigs = {};
    this.save();
  }

  save() {
    try {
      const data = {
        updatedAt: new Date().toISOString(),
        models: this.models,
        providerConfigs: this.providerConfigs,
      };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      logger.error(`[ModelRegistry] Failed to save models configuration: ${err.message}`);
    }
  }

  getProviders() {
    return Object.values(PROVIDERS).map((p) => {
      const storedConfig = this.providerConfigs[p.id] || {};
      const envVal = p.envKey ? process.env[p.envKey] : null;
      const apiKey = storedConfig.apiKey || envVal || (p.id === "nvidia" ? config.llm.textApiKey : "");
      const isConfigured = Boolean(apiKey || p.id === "ollama" || p.id === "antigravity");
      const configuredModels = this.models.filter((m) => m.provider === p.id);

      return {
        ...p,
        isConfigured,
        apiKey: apiKey ? "••••••••" : "",
        hasKey: Boolean(apiKey),
        configuredModelCount: configuredModels.length,
        models: p.presetModels || [],
        selectedModelIds: configuredModels.map((m) => m.id),
        customBaseUrl: storedConfig.baseURL || p.defaultBaseUrl || "",
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

    const lower = String(modelId).toLowerCase();
    if (lower.startsWith("claude")) return PROVIDERS.anthropic;
    if (lower.startsWith("gpt-") || lower.startsWith("o1") || lower.startsWith("o3")) return PROVIDERS.openai;
    if (lower.startsWith("gemini")) return PROVIDERS.gemini;
    if (lower.startsWith("deepseek")) return PROVIDERS.deepseek;
    if (lower.includes("llama") || lower.includes("groq") || lower.includes("mixtral")) return PROVIDERS.groq;
    if (lower.includes("ollama")) return PROVIDERS.ollama;
    if (lower.startsWith("nvidia/") || lower.startsWith("meta/")) return PROVIDERS.nvidia;

    return PROVIDERS.nvidia;
  }

  getEndpointConfig(modelId) {
    const model = this.getModel(modelId);
    const provider = this.getProviderForModel(modelId);
    const storedConfig = this.providerConfigs[provider.id] || {};

    let apiKey = model?.apiKey || storedConfig.apiKey || "";
    if (!apiKey && provider.envKey && process.env[provider.envKey]) {
      apiKey = process.env[provider.envKey];
    } else if (!apiKey && provider.id === "nvidia") {
      apiKey = config.llm.textApiKey || process.env.NVIDIA_API_KEY || "";
    } else if (!apiKey && provider.id === "openai") {
      apiKey = process.env.OPENAI_API_KEY || config.llm.textApiKey || "";
    } else if (!apiKey && provider.id === "ollama") {
      apiKey = "ollama";
    }

    const baseURL = model?.baseURL || storedConfig.baseURL || provider.defaultBaseUrl || config.llm.textBaseUrl;

    return {
      baseURL,
      apiKey: apiKey || config.llm.textApiKey,
      provider: provider.id,
    };
  }

  async testProvider({ providerId, apiKey = null, customBaseUrl = null }) {
    const provider = PROVIDERS[providerId];
    if (!provider) {
      return { success: false, error: `Unknown provider: ${providerId}` };
    }

    const t0 = Date.now();

    // 1. Antigravity CLI local test
    if (providerId === "antigravity") {
      const { AntigravityCliClient } = await import("./antigravityCliClient.js");
      const available = AntigravityCliClient.isAvailable();
      return {
        success: available,
        latencyMs: Date.now() - t0,
        availableModels: provider.presetModels,
        error: available ? null : "Antigravity CLI (agy) not found in ~/.gemini/bin/agy.exe",
      };
    }

    // 2. Ollama local ping
    if (providerId === "ollama") {
      const baseUrl = customBaseUrl || provider.defaultBaseUrl || "http://localhost:11434/v1";
      const tagsUrl = baseUrl.replace(/\/v1\/?$/, "") + "/api/tags";
      try {
        const res = await fetch(tagsUrl, { signal: AbortSignal.timeout(3500) });
        if (!res.ok) throw new Error(`Ollama returned status ${res.status}`);
        const data = await res.json();
        const models = Array.isArray(data.models) ? data.models.map((m) => ({ id: m.name, name: m.name, tags: ["Local GGUF"] })) : [];
        return {
          success: true,
          latencyMs: Date.now() - t0,
          availableModels: models.length > 0 ? models : provider.presetModels,
        };
      } catch (err) {
        return {
          success: false,
          latencyMs: Date.now() - t0,
          error: `Could not connect to Ollama at ${baseUrl}. Ensure Ollama is running (ollama serve).`,
        };
      }
    }

    // 3. Cloud Providers with API Key
    const key = (apiKey && apiKey !== "••••••••" ? apiKey : null) ||
      this.providerConfigs[providerId]?.apiKey ||
      (provider.envKey ? process.env[provider.envKey] : null) ||
      (providerId === "nvidia" ? config.llm.textApiKey : "");

    if (!key) {
      return {
        success: false,
        latencyMs: 0,
        error: `Missing API key for ${provider.name}. Please enter your key.`,
      };
    }

    const baseUrl = customBaseUrl || this.providerConfigs[providerId]?.baseURL || provider.defaultBaseUrl;

    try {
      let testEndpoint = `${baseUrl}/models`;
      let headers = { Authorization: `Bearer ${key}` };

      if (providerId === "anthropic") {
        testEndpoint = "https://api.anthropic.com/v1/models";
        headers = {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        };
      }

      const res = await fetch(testEndpoint, {
        headers,
        signal: AbortSignal.timeout(6000),
      });

      const latencyMs = Date.now() - t0;

      if (!res.ok) {
        let errDetail = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          errDetail = errJson.error?.message || errJson.message || errDetail;
        } catch { }
        return {
          success: false,
          latencyMs,
          error: `${provider.name} error: ${errDetail}`,
        };
      }

      let discoveredModels = [];
      try {
        const body = await res.json();
        const rawList = Array.isArray(body.data) ? body.data : Array.isArray(body.models) ? body.models : [];
        discoveredModels = rawList.slice(0, 30).map((m) => ({
          id: m.id || m.name,
          name: m.id || m.name,
          tags: ["Account Model"],
        }));
      } catch { }

      return {
        success: true,
        latencyMs,
        availableModels: discoveredModels.length > 0 ? discoveredModels : (provider.presetModels || []),
      };
    } catch (err) {
      return {
        success: false,
        latencyMs: Date.now() - t0,
        error: `Connection error: ${err.message}`,
      };
    }
  }

  saveProviderConfig({ providerId, apiKey = null, customBaseUrl = null, selectedModels = [] }) {
    const provider = PROVIDERS[providerId];
    if (!provider) {
      throw new Error(`Unknown provider: ${providerId}`);
    }

    if (!this.providerConfigs[providerId]) {
      this.providerConfigs[providerId] = {};
    }

    if (apiKey !== null && apiKey !== undefined && apiKey !== "••••••••") {
      this.providerConfigs[providerId].apiKey = apiKey.trim();
      if (provider.envKey) {
        process.env[provider.envKey] = apiKey.trim();
      }
    }

    if (customBaseUrl !== null && customBaseUrl !== undefined) {
      this.providerConfigs[providerId].baseURL = customBaseUrl.trim();
    }

    this.models = this.models.filter((m) => m.provider !== providerId);

    if (Array.isArray(selectedModels)) {
      selectedModels.forEach((m) => {
        const modelId = typeof m === "string" ? m : m.id;
        const modelName = typeof m === "object" && m.name ? m.name : modelId;
        const tags = typeof m === "object" && Array.isArray(m.tags) ? m.tags : [];
        this.models.push({
          id: modelId,
          name: modelName,
          provider: providerId,
          tags,
          baseURL: this.providerConfigs[providerId]?.baseURL || provider.defaultBaseUrl || "",
          apiKey: this.providerConfigs[providerId]?.apiKey || "",
          updatedAt: new Date().toISOString(),
        });
      });
    }

    this.save();
    logger.info(`[ModelRegistry] Saved configuration for provider ${providerId} (${selectedModels.length} models active)`);
    return { success: true, models: this.models };
  }

  addModel({ id, name, provider = "nvidia", description = "", baseURL = null, apiKey = null }) {
    if (!id || typeof id !== "string") {
      throw new Error("Model ID is required");
    }
    const cleanId = id.trim();
    const cleanName = (name || cleanId).trim();

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
