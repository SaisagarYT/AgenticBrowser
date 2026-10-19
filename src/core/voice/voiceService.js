"use strict";

import fs from "node:fs";
import path from "node:path";
import { cleanTextForSpeech } from "./speechFilter.js";
import { logger } from "../../utils/logger.js";

const SETTINGS_FILE = path.resolve(process.cwd(), "data", "voice_settings.json");

const CURATED_VOICES = [
  { id: "af_heart", name: "Kira — Warm & Natural (Default)", gender: "Female", lang: "en-US", description: "Empathetic, expressive, natural breathing" },
  { id: "af_sky", name: "Kira — Gentle & Friendly", gender: "Female", lang: "en-US", description: "Smooth, friendly conversational tone" },
  { id: "af_bella", name: "Kira — Confident & Energetic", gender: "Female", lang: "en-US", description: "Dynamic, upbeat assistant voice" },
  { id: "af_nicole", name: "Kira — Professional & Crisp", gender: "Female", lang: "en-US", description: "Clear, focused articulation" },
  { id: "bf_emma", name: "Kira — British Articulate", gender: "Female", lang: "en-GB", description: "Poised, sophisticated British accent" },
  { id: "bf_isabella", name: "Kira — British Soft", gender: "Female", lang: "en-GB", description: "Calm, gentle British inflection" },
  { id: "bm_george", name: "Kira — British Butler (Male)", gender: "Male", lang: "en-GB", description: "Refined, calm British male tone" },
  { id: "am_michael", name: "Kira — American Natural (Male)", gender: "Male", lang: "en-US", description: "Casual, modern American male voice" },
];

export class VoiceService {
  constructor() {
    this.ttsInstance = null;
    this.isLoading = false;
    this.initPromise = null;
    this.settings = this.loadSettings();
  }

  loadSettings() {
    try {
      if (fs.existsSync(SETTINGS_FILE)) {
        const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
        return JSON.parse(raw);
      }
    } catch (err) {
      logger.warn(`[VoiceService] Failed to load voice settings: ${err.message}`);
    }

    return {
      activeVoice: "af_heart",
      speed: 1.0,
      autoSpeak: true,
      voiceInputEnabled: true,
    };
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      const dir = path.dirname(SETTINGS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(this.settings, null, 2), "utf8");
    } catch (err) {
      logger.warn(`[VoiceService] Failed to save voice settings: ${err.message}`);
    }
    return this.settings;
  }

  async ensureModelLoaded() {
    if (this.ttsInstance) return this.ttsInstance;

    if (this.initPromise) {
      return await this.initPromise;
    }

    this.initPromise = (async () => {
      logger.info("[VoiceService] Initializing Kokoro TTS (onnx-community/Kokoro-82M-v1.0-ONNX, q8)...");
      this.isLoading = true;
      try {
        const { KokoroTTS } = await import("kokoro-js");
        this.ttsInstance = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
          dtype: "q8",
          device: "cpu",
        });
        logger.info("[VoiceService] Kokoro TTS initialized successfully!");
        return this.ttsInstance;
      } catch (err) {
        logger.error(`[VoiceService] Model loading error: ${err.message}`);
        throw err;
      } finally {
        this.isLoading = false;
        this.initPromise = null;
      }
    })();

    return await this.initPromise;
  }

  async synthesize(rawText, options = {}) {
    const cleanText = cleanTextForSpeech(rawText);
    if (!cleanText) {
      return { success: false, error: "Empty or invalid text to speak." };
    }

    const voice = options.voice || this.settings.activeVoice || "af_heart";
    const speed = typeof options.speed === "number" ? options.speed : (this.settings.speed || 1.0);

    const startTime = Date.now();
    try {
      const tts = await this.ensureModelLoaded();
      logger.info(`[VoiceService] Synthesizing speech with voice "${voice}" (speed: ${speed}): "${cleanText.slice(0, 60)}..."`);

      const audio = await tts.generate(cleanText, {
        voice,
        speed,
      });

      const blob = audio.toBlob();
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const audioUrl = `data:audio/wav;base64,${buffer.toString("base64")}`;
      const elapsed = Date.now() - startTime;

      logger.info(`[VoiceService] Synthesis complete in ${elapsed}ms (${buffer.length} bytes)`);

      return {
        success: true,
        audioUrl,
        cleanText,
        voice,
        durationMs: elapsed,
      };
    } catch (err) {
      logger.error(`[VoiceService] Synthesis failed: ${err.message}`);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  getCuratedVoices() {
    return CURATED_VOICES;
  }

  getSettings() {
    return {
      ...this.settings,
      voices: CURATED_VOICES,
    };
  }
}

export const voiceService = new VoiceService();
