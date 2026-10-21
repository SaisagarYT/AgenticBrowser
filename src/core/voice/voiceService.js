"use strict";

import fs from "node:fs";
import path from "node:path";
import { cleanTextForSpeech, generateSpokenSummary } from "./speechFilter.js";
import { logger } from "../../utils/logger.js";

const SETTINGS_FILE = path.resolve(process.cwd(), "data", "voice_settings.json");

const CURATED_VOICES = [
  { id: "af_heart", name: "Kira — Warm & Natural (Default)", gender: "Female", lang: "en-US", description: "Empathetic, expressive, natural breathing" },
  { id: "in_neerja", name: "Kira — Indian Natural (Female)", gender: "Female", lang: "en-IN", description: "Expressive, warm Indian English female tone" },
  { id: "in_prabhat", name: "Kira — Indian Natural (Male)", gender: "Male", lang: "en-IN", description: "Clear, conversational Indian English male tone" },
  { id: "af_sky", name: "Kira — Gentle & Friendly", gender: "Female", lang: "en-US", description: "Smooth, friendly conversational tone" },
  { id: "af_bella", name: "Kira — Confident & Energetic", gender: "Female", lang: "en-US", description: "Dynamic, upbeat assistant voice" },
  { id: "af_nicole", name: "Kira — Professional & Crisp", gender: "Female", lang: "en-US", description: "Clear, focused articulation" },
  { id: "bf_emma", name: "Kira — British Articulate", gender: "Female", lang: "en-GB", description: "Poised, sophisticated British accent" },
  { id: "bf_isabella", name: "Kira — British Soft", gender: "Female", lang: "en-GB", description: "Calm, gentle British inflection" },
  { id: "bm_george", name: "Kira — British Butler (Male)", gender: "Male", lang: "en-GB", description: "Refined, calm British male tone" },
  { id: "am_michael", name: "Kira — American Natural (Male)", gender: "Male", lang: "en-US", description: "Casual, modern American male voice" },
];

const KOKORO_TO_EDGE_VOICE_MAP = {
  af_heart: "en-US-AriaNeural",
  in_neerja: "en-IN-NeerjaNeural",
  in_prabhat: "en-IN-PrabhatNeural",
  af_sky: "en-US-JennyNeural",
  af_bella: "en-US-MichelleNeural",
  af_nicole: "en-US-AvaNeural",
  bf_emma: "en-GB-SoniaNeural",
  bf_isabella: "en-GB-LibbyNeural",
  bm_george: "en-GB-RyanNeural",
  am_michael: "en-US-GuyNeural",
};

export class VoiceService {
  constructor() {
    this.ttsInstance = null;
    this.isLoading = false;
    this.initPromise = null;
    this.settings = this.loadSettings();
  }

  loadSettings() {
    const defaults = {
      activeVoice: "af_heart",
      speed: 1.0,
      autoSpeak: true,
      voiceInputEnabled: true,
      recognitionLang: "en-IN",
      ttsEngine: "edge",
    };
    try {
      if (fs.existsSync(SETTINGS_FILE)) {
        const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
        return { ...defaults, ...JSON.parse(raw) };
      }
    } catch (err) {
      logger.warn(`[VoiceService] Failed to load voice settings: ${err.message}`);
    }

    return defaults;
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
        const { createRequire } = await import("node:module");
        const nodeRequire = createRequire(import.meta.url);
        const { KokoroTTS } = nodeRequire("kokoro-js");
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

  async synthesizeWithEdge(textToSpeak, options = {}) {
    const rawVoice = options.voice || this.settings.activeVoice || "af_heart";
    const edgeVoice = rawVoice.includes("-") ? rawVoice : (KOKORO_TO_EDGE_VOICE_MAP[rawVoice] || "en-US-AriaNeural");
    const startTime = Date.now();

    try {
      const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
      const tts = new MsEdgeTTS();
      await tts.setMetadata(edgeVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      logger.info(`[VoiceService] Edge TTS synthesizing with "${edgeVoice}": "${textToSpeak.slice(0, 70)}..."`);

      const { audioStream } = tts.toStream(textToSpeak);
      const chunks = [];
      const buffer = await new Promise((resolve, reject) => {
        audioStream.on("data", chunk => chunks.push(chunk));
        audioStream.on("end", () => {
          tts.close();
          resolve(Buffer.concat(chunks));
        });
        audioStream.on("error", err => {
          tts.close();
          reject(err);
        });
      });

      const audioUrl = `data:audio/mp3;base64,${buffer.toString("base64")}`;
      const elapsed = Date.now() - startTime;
      logger.info(`[VoiceService] Edge TTS synthesis complete in ${elapsed}ms (${buffer.length} bytes)`);

      return {
        success: true,
        audioUrl,
        cleanText: textToSpeak,
        spokenText: textToSpeak,
        voice: edgeVoice,
        durationMs: elapsed,
      };
    } catch (err) {
      logger.warn(`[VoiceService] Edge TTS notice (${err.message}), falling back to Kokoro.`);
      return await this.synthesizeWithKokoro(textToSpeak, options);
    }
  }

  async synthesizeWithKokoro(textToSpeak, options = {}) {
    const voice = options.voice || this.settings.activeVoice || "af_heart";
    const speed = typeof options.speed === "number" ? options.speed : (this.settings.speed || 1.0);
    const startTime = Date.now();

    try {
      const tts = await this.ensureModelLoaded();
      logger.info(`[VoiceService] Kokoro TTS synthesizing with voice "${voice}" (speed: ${speed}): "${textToSpeak.slice(0, 70)}..."`);

      const audio = await tts.generate(textToSpeak, {
        voice,
        speed,
      });

      const blob = audio.toBlob();
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const audioUrl = `data:audio/wav;base64,${buffer.toString("base64")}`;
      const elapsed = Date.now() - startTime;

      logger.info(`[VoiceService] Kokoro synthesis complete in ${elapsed}ms (${buffer.length} bytes)`);

      return {
        success: true,
        audioUrl,
        cleanText: textToSpeak,
        spokenText: textToSpeak,
        voice,
        durationMs: elapsed,
      };
    } catch (err) {
      logger.error(`[VoiceService] Kokoro synthesis failed: ${err.message}`);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  async synthesize(rawText, options = {}) {
    let textToSpeak = "";
    if (options.spokenText) {
      textToSpeak = options.spokenText;
    } else if (options.userCommand) {
      try {
        const { VoiceAgent } = await import("../../agents/voiceAgent.js");
        textToSpeak = await VoiceAgent.generateVoiceResponse({
          userCommand: options.userCommand,
          agentOutcome: rawText,
          taskStatus: options.taskStatus || "COMPLETED",
          model: options.model,
        });
      } catch {
        textToSpeak = generateSpokenSummary(rawText, options.userCommand);
      }
    } else if (options.distill !== false) {
      textToSpeak = generateSpokenSummary(rawText, options.userPrompt);
    } else {
      textToSpeak = cleanTextForSpeech(rawText);
    }

    if (!textToSpeak) {
      return { success: false, error: "Empty or invalid text to speak." };
    }

    const engine = options.engine || this.settings.ttsEngine || "browser";
    if (engine === "edge") {
      return await this.synthesizeWithEdge(textToSpeak, options);
    }

    return await this.synthesizeWithKokoro(textToSpeak, options);
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
