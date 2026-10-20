"use strict";

import { pipeline } from "@huggingface/transformers";

/**
 * Local Whisper Speech-to-Text (STT) Service
 * Uses ONNX Runtime and Hugging Face Transformers.js to execute OpenAI's Whisper model
 * locally on CPU. 100% offline, free, and highly accurate across all accents.
 */
class STTService {
  constructor() {
    this.transcriber = null;
    this.isLoading = false;
    this.initPromise = null;
  }

  /**
   * Pre-warm or get the active Whisper pipeline
   */
  async getTranscriber() {
    if (this.transcriber) return this.transcriber;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        console.log("[STTService] Initializing local ONNX Whisper ASR model...");
        const start = Date.now();
        this.transcriber = await pipeline("automatic-speech-recognition", "onnx-community/whisper-tiny.en", {
          device: "cpu",
        });
        console.log(`[STTService] Whisper ASR model ready in ${Date.now() - start}ms`);
        return this.transcriber;
      } catch (err) {
        console.error("[STTService] Failed to initialize Whisper model:", err);
        this.initPromise = null;
        throw err;
      }
    })();

    return this.initPromise;
  }

  /**
   * Clean raw Whisper output, stripping hallucinations and acoustic noise tokens
   * @param {string} text
   * @returns {string}
   */
  cleanTranscript(text) {
    if (!text || typeof text !== "string") return "";
    return text
      .replace(/\([^)]*\)/g, "") // strip (applause), (music), (sigh), (phone ringing)
      .replace(/\[[^\]]*\]/g, "") // strip [BLANK_AUDIO], [SILENCE]
      .replace(/^[.,?!:;\s]+|[.,?!:;\s]+$/g, "") // strip leading/trailing punctuation
      .trim();
  }

  /**
   * Transcribe Base64-encoded Float32Array PCM audio (sampled at 16,000 Hz)
   * @param {string} base64Audio
   * @returns {Promise<{ success: boolean, text: string, error?: string }>}
   */
  async transcribe(base64Audio) {
    if (!base64Audio || typeof base64Audio !== "string") {
      return { success: false, text: "", error: "Missing or invalid audio payload" };
    }

    try {
      const transcriber = await this.getTranscriber();
      const rawBuffer = Buffer.from(base64Audio, "base64");
      // Align to exact multiple of 4 bytes (Float32 size)
      const validByteLength = rawBuffer.byteLength - (rawBuffer.byteLength % 4);
      if (validByteLength < 3200) {
        // Require at least 0.2s of audio (800 samples * 4 bytes = 3200 bytes at 16kHz)
        return { success: true, text: "" };
      }

      const alignedBuffer = new ArrayBuffer(validByteLength);
      new Uint8Array(alignedBuffer).set(rawBuffer.subarray(0, validByteLength));
      const float32Samples = new Float32Array(alignedBuffer);

      const start = Date.now();
      const output = await transcriber(float32Samples);
      const rawText = output && output.text ? output.text : "";
      const text = this.cleanTranscript(rawText);
      const durationMs = Date.now() - start;

      if (text) {
        console.log(`[STTService] Transcribed in ${durationMs}ms: "${text}"`);
      }

      return { success: true, text };
    } catch (err) {
      console.error("[STTService] Transcription error:", err);
      return { success: false, text: "", error: err.message };
    }
  }
}

let instance = null;

export function getSTTService() {
  if (!instance) {
    instance = new STTService();
  }
  return instance;
}
