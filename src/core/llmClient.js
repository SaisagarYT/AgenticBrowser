"use strict";

import OpenAI from "openai";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";

class LLMClient {
  constructor() {
    this.textClient = new OpenAI({
      apiKey: config.llm.textApiKey || "dummy-key",
      baseURL: config.llm.textBaseUrl,
    });

    this.visionClient = new OpenAI({
      apiKey: config.llm.visionApiKey || config.llm.textApiKey || "dummy-key",
      baseURL: config.llm.visionBaseUrl || config.llm.textBaseUrl,
    });
  }

  _ensureApiKey() {
    if (!config.llm.textApiKey || config.llm.textApiKey === "dummy-key") {
      throw new Error(
        "Missing API Key: Please set AGENTIC_BROWSER_TEXT_API_KEY in your .env file (e.g. nvapi-...) to enable the agent."
      );
    }
  }

  async _withRetry(fn, retries = 3, delayMs = 1500) {
    let currentDelay = delayMs;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        const isTransient =
          err.status === 503 ||
          err.status === 429 ||
          err.status >= 500 ||
          err.message?.includes("503") ||
          err.message?.includes("overloaded") ||
          err.message?.includes("rate limit") ||
          err.code === "ECONNRESET" ||
          err.code === "ETIMEDOUT";

        if (attempt < retries && isTransient) {
          logger.warn(`[LLMClient] Transient API warning (${err.message}). Retrying attempt ${attempt + 1}/${retries} in ${currentDelay}ms...`);
          await new Promise((r) => setTimeout(r, currentDelay));
          currentDelay *= 2;
        } else {
          throw err;
        }
      }
    }
  }

  async generateJson({ systemPrompt, userPrompt, temperature = 0.5, model = config.llm.textModel, maxTokens = 2048 }) {
    this._ensureApiKey();
    try {
      logger.debug(`Calling LLM model: ${model} with JSON output`);
      const response = await this._withRetry(() =>
        this.textClient.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
          response_format: { type: "json_object" },
        })
      );

      const raw = response.choices?.[0]?.message?.content?.trim() || "{}";
      return this._extractJson(raw);
    } catch (err) {
      // Fallback: try parsing JSON from code blocks if response_format is unsupported by third-party proxies
      logger.warn(`JSON completion error (${err.message}). Attempting plain text fallback.`);
      const fallback = await this.generateText({
        systemPrompt: `${systemPrompt}\n\nIMPORTANT: Respond ONLY with valid JSON. Do not include any explanations, prologue, epilogue, or markdown formatting outside the JSON object.`,
        userPrompt,
        temperature,
        model,
        maxTokens,
      });

      return this._extractJson(fallback);
    }
  }

  async generateText({ systemPrompt, userPrompt, temperature = 0.5, model = config.llm.textModel, maxTokens = 2048 }) {
    this._ensureApiKey();
    const response = await this._withRetry(() =>
      this.textClient.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      })
    );

    return response.choices?.[0]?.message?.content?.trim() || "";
  }

  async analyzeVision({ prompt, base64Before, base64After, model = config.llm.visionModel }) {
    if (!config.llm.visionEnabled) {
      return "Vision analysis disabled in configuration.";
    }

    try {
      const isNvidiaNim = (config.llm.visionBaseUrl || "").includes("nvidia.com") || (model && (model.startsWith("meta/") || model.startsWith("nvidia/")));

      const content = [
        { type: "text", text: prompt },
      ];

      if (isNvidiaNim) {
        // NVIDIA NIM endpoints support at most 1 image per request. Use the resulting after-action state.
        const targetImage = base64After || base64Before;
        if (targetImage) {
          content.push({
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${targetImage}`, detail: "high" },
          });
        }
      } else {
        if (base64Before) {
          content.push({
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${base64Before}`, detail: "high" },
          });
        }
        if (base64After) {
          content.push({
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${base64After}`, detail: "high" },
          });
        }
      }

      const response = await this.visionClient.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content,
          },
        ],
        temperature: 0.2,
      });

      return response.choices?.[0]?.message?.content?.trim() || "";
    } catch (err) {
      // Fallback: If multiple images were rejected by provider, retry with single after-screenshot
      if (err.message && err.message.includes("image") && base64After) {
        try {
          const fallbackRes = await this.visionClient.chat.completions.create({
            model,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64After}`, detail: "high" } },
                ],
              },
            ],
            temperature: 0.2,
          });
          return fallbackRes.choices?.[0]?.message?.content?.trim() || "";
        } catch {
          // Fall through to error logging
        }
      }
      logger.error(`Vision analysis failed: ${err.message}`);
      return `Screenshot analysis error: ${err.message}`;
    }
  }

  _extractJson(text) {
    if (!text || typeof text !== "string") {
      throw new Error("Empty or non-string response received from model");
    }

    const trimmed = text.trim();

    // 1. Direct JSON parse
    try {
      return JSON.parse(trimmed);
    } catch {
      // continue to fallbacks
    }

    // 2. Strip markdown fences: ```json ... ``` or ``` ... ```
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch && fenceMatch[1]) {
      try {
        return JSON.parse(fenceMatch[1].trim());
      } catch {
        // continue
      }
    }

    // 3. Extract outermost curly braces: { ... }
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const candidate = trimmed.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        // continue
      }
    }

    throw new Error(`Failed to parse JSON from model response: "${trimmed.substring(0, 150)}..."`);
  }
}

export const llmClient = new LLMClient();
