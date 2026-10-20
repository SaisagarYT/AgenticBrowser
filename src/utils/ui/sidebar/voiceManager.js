"use strict";

/**
 * Kira Voice Manager
 * Handles Hands-Free Continuous Microphone Listening (SpeechRecognition),
 * Floating Natural Audio Wave Widget (Web Audio API + Canvas),
 * and Kokoro Text-to-Speech (HTML5 Audio) with dedicated Kira Companion Voice Agent.
 * Manages the Voice Toggle Switch (styled identical to the Visual Marks Eye Switch with crimson red recording theme).
 */
export function getVoiceManagerCode() {
  return `
  // --------------------------------------------------------------------------
  // Kira Voice & Continuous Audio State
  // --------------------------------------------------------------------------
  let isVoiceModeActive = false; // Continuous Hands-Free Listening Mode
  let isListening = false;
  let isSpeaking = false;
  let isPausedForExecution = false;
  let restartTimeout = null;
  let speechTimeoutTimer = null;
  let executionWatchdogTimer = null;
  let speechRecognizer = null;
  let activeAudioPlayer = null;
  let activeSpeakingBtn = null;
  let activeInterimText = "";
  let recognitionRestartTimer = null;
  let activeSpeechUtterance = null;
  let activeSpeechUtteranceText = "";
  let speakingStartTime = 0;
  let speechKeepAliveInterval = null;
  let voiceSettings = {
    activeVoice: "af_heart",
    speed: 1.0,
    autoSpeak: false,
    recognitionLang: "en-IN",
    ttsEngine: "browser",
  };

  // Voice Toggle Switch Elements (voiceToggleBtn and railVoiceToggleBtn are declared in controller scope)

  // --------------------------------------------------------------------------
  // Floating Bottom-Center Natural Audio Wave Widget
  // --------------------------------------------------------------------------
  let floatWidgetEl = null;
  let waveCanvas = null;
  let waveCtx = null;
  let audioContext = null;
  let audioSourceNode = null;
  let analyserNode = null;
  let audioCaptureNode = null;
  let audioDestinationNode = null;
  let micMediaStream = null;
  let waveAnimFrameId = null;
  let smoothedHeights = [4, 4, 4, 4, 4, 4, 4, 4, 4];
  let pcmChunks = [];
  let preRollBuffer = [];
  let noiseFloor = 0.002;
  let isRecordingSpeech = false;
  let lastSpeechTime = 0;
  let isTranscribing = false;
  let isStartingVisualizer = false;

  function getOrCreateFloatingWidget() {
    if (floatWidgetEl) return floatWidgetEl;
    floatWidgetEl = document.getElementById("as-voice-floating-widget");
    if (!floatWidgetEl) {
      floatWidgetEl = document.createElement("div");
      floatWidgetEl.id = "as-voice-floating-widget";
      floatWidgetEl.innerHTML =
        '<div class="as-float-mic-btn" title="Kira Voice Active">' +
        ICONS.mic +
        '</div>' +
        '<div class="as-float-info">' +
        '  <span class="as-float-title">Kira</span>' +
        '  <span class="as-float-status" id="as-float-status-text">Listening...</span>' +
        '</div>' +
        '<div class="as-float-canvas-wrapper">' +
        '  <canvas id="as-float-wave-canvas" width="100" height="24"></canvas>' +
        '</div>' +
        '<button class="as-float-close-btn" id="as-float-btn-close" type="button" title="Close Voice Mode (Alt+V)">' +
        ICONS.close +
        '</button>';

      // Mount into sidebar wrapper or document body
      const mountParent = document.getElementById("agentic-sidebar-wrapper") || document.body;
      mountParent.appendChild(floatWidgetEl);

      const closeBtn = floatWidgetEl.querySelector("#as-float-btn-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => setVoiceActive(false));
      }

      floatWidgetEl.addEventListener("click", (e) => {
        if (e.target.closest("#as-float-btn-close")) return;
        if (isSpeaking) {
          stopSpeaking();
        }
      });

      waveCanvas = floatWidgetEl.querySelector("#as-float-wave-canvas");
      if (waveCanvas) {
        waveCtx = waveCanvas.getContext("2d");
      }
    }
    return floatWidgetEl;
  }

  function updateFloatStatus(text) {
    const el = document.getElementById("as-float-status-text");
    if (el) el.textContent = text;
  }

  async function startWaveVisualizer() {
    if (isStartingVisualizer) return;
    isStartingVisualizer = true;

    const widget = getOrCreateFloatingWidget();
    widget.style.display = "flex";
    updateFloatStatus("Listening...");

    // Setup Web Audio Analyser & Real-time Speech Capture
    try {
      if (!audioContext || audioContext.state === "closed") {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          try {
            audioContext = new AudioCtx({ sampleRate: 16000 });
          } catch {
            audioContext = new AudioCtx();
          }
        }
      }
      if (audioContext && audioContext.state === "suspended") {
        await audioContext.resume();
      }

      if (!micMediaStream || !micMediaStream.active) {
        micMediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        }).catch(async (err) => {
          console.warn("[Kira Voice] getUserMedia with constraints error, falling back to basic audio:", err);
          return await navigator.mediaDevices.getUserMedia({ audio: true }).catch((err2) => {
            console.error("[Kira Voice] getUserMedia fallback failed:", err2);
            updateFloatStatus("Mic blocked");
            if (statusLabel) {
              statusLabel.textContent = "Kira Voice: Microphone access blocked or not available.";
            }
            return null;
          });
        });
      }

      if (micMediaStream && audioContext) {
        // Disconnect any stale audio nodes
        if (audioSourceNode) {
          try { audioSourceNode.disconnect(); } catch {}
          audioSourceNode = null;
        }
        if (analyserNode) {
          try { analyserNode.disconnect(); } catch {}
          analyserNode = null;
        }
        if (audioCaptureNode) {
          try { audioCaptureNode.disconnect(); } catch {}
          audioCaptureNode = null;
        }
        if (audioDestinationNode) {
          try { audioDestinationNode.disconnect(); } catch {}
          audioDestinationNode = null;
        }

        // Create persistent media stream source
        audioSourceNode = audioContext.createMediaStreamSource(micMediaStream);

        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.3; // Snappy live acoustic tracking
        audioSourceNode.connect(analyserNode);

        // Connect speech audio recording processor (16kHz for local Whisper ASR)
        audioCaptureNode = audioContext.createScriptProcessor(4096, 1, 1);

        // Connect to MediaStreamDestination (prevents Chromium power-saving zero-gain muting)
        audioDestinationNode = audioContext.createMediaStreamDestination();
        audioSourceNode.connect(audioCaptureNode);
        audioCaptureNode.connect(audioDestinationNode);

        // Retain references on window to permanently prevent V8 garbage collection
        window._kiraAudioCtx = audioContext;
        window._kiraAudioSource = audioSourceNode;
        window._kiraCaptureNode = audioCaptureNode;
        window._kiraAnalyser = analyserNode;
        window._kiraAudioDest = audioDestinationNode;
        window._kiraMediaStream = micMediaStream;

        audioCaptureNode.onaudioprocess = (e) => {
          if (!isVoiceModeActive || isSpeaking || isPausedForExecution || isTranscribing) {
            return;
          }

          const channelData = e.inputBuffer.getChannelData(0);
          let sumSquares = 0;
          for (let k = 0; k < channelData.length; k++) {
            sumSquares += channelData[k] * channelData[k];
          }
          const frameRms = Math.sqrt(sumSquares / channelData.length);

          // Native 16kHz sample capture (or fallback linear resampling if device locked rate)
          let downsampled;
          if (audioContext.sampleRate === 16000) {
            downsampled = new Float32Array(channelData);
          } else {
            const ratio = audioContext.sampleRate / 16000;
            const targetSamples = Math.round(channelData.length / ratio);
            downsampled = new Float32Array(targetSamples);
            for (let k = 0; k < targetSamples; k++) {
              const origIdx = k * ratio;
              const lower = Math.floor(origIdx);
              const upper = Math.min(lower + 1, channelData.length - 1);
              const weight = origIdx - lower;
              downsampled[k] = channelData[lower] * (1 - weight) + channelData[upper] * weight;
            }
          }

          // Keep rolling pre-roll ring buffer (~350ms of audio)
          preRollBuffer.push(downsampled);
          if (preRollBuffer.length > 5) {
            preRollBuffer.shift();
          }

          // Dynamic Voice Activity Detection (VAD)
          // Adapts to quiet microphones and room noise floor
          const speechThreshold = Math.max(0.0035, noiseFloor * 1.8);

          if (frameRms > speechThreshold) {
            if (!isRecordingSpeech) {
              isRecordingSpeech = true;
              updateFloatStatus("Hearing you...");
              if (statusLabel) {
                statusLabel.textContent = "Kira Voice: Hearing you...";
              }
              // Prepend pre-roll buffer so initial consonants ("h", "th", etc.) are never lost
              for (let p = 0; p < preRollBuffer.length; p++) {
                pcmChunks.push(preRollBuffer[p]);
              }
            }
            lastSpeechTime = Date.now();
          } else {
            // Adapt resting ambient noise floor during silence
            noiseFloor = noiseFloor * 0.97 + frameRms * 0.03;
          }

          if (isRecordingSpeech) {
            pcmChunks.push(downsampled);

            // Commit when user pauses for 750ms after speaking OR max utterance reaches 15s
            const elapsedSinceSpeech = Date.now() - lastSpeechTime;
            const totalEstimatedSamples = pcmChunks.length * downsampled.length;
            if ((elapsedSinceSpeech > 750 && totalEstimatedSamples >= 3200) || totalEstimatedSamples > 240000) {
              isRecordingSpeech = false;
              updateFloatStatus("Transcribing...");
              commitVoiceRecording();
            }
          }
        };
      }
    } catch (e) {
      console.warn("Could not attach audio analyser:", e);
    } finally {
      isStartingVisualizer = false;
    }

    renderWaveLoop();
  }

  let interimCommitTimer = null;
  let lastStopInterruptTime = 0;

  function normalizeVoiceTranscript(rawText) {
    if (!rawText) return "";
    let text = rawText.trim();

    // 1. Multi-word wake word phonetics (e.g. "Ek Hira", "Ek hero", "Ek Heera", "Hey Kheera")
    text = text
      .replace(/\b(ek|ake|ack|ec|ak|ae|ai|a)\s+(hira|heera|keera|kera|geera|veera|hero|khera|kheera)\b/gi, "hey kira")
      .replace(/\b(hey|hay|hi|hello)\s+(hira|heera|keera|kera|geera|veera|hero|khera|kheera)\b/gi, "hey kira")
      .replace(/\b(hira|heera|keera|kera|khera|kheera)\b/gi, "kira")
      .replace(/\b(ek\s*hero)\b/gi, "hey kira")
      .replace(/\b(ek\s*kira)\b/gi, "hey kira")
      .replace(/\b(ekera|hekira)\b/gi, "hey kira");

    // 2. Audio check query normalizer ("can hear", "can u hear", etc.)
    text = text
      .replace(/\bcan\s+(you\s+|u\s+)?hear\b(?!\s*me)/gi, "can you hear me")
      .replace(/\bcan\s+u\s+hear\s+me\b/gi, "can you hear me")
      .replace(/\bcan\s+hear\s+me\b/gi, "can you hear me")
      .replace(/\bcan\s+hear\b/gi, "can you hear me")
      .replace(/\bare\s+you\s+(able\s+to\s+hear|hearing)\s*(me)?\b/gi, "can you hear me");

    return text;
  }

  function commitVoiceText(resultText) {
    if (!resultText) return;
    const cleanText = normalizeVoiceTranscript(resultText).trim();
    if (!cleanText || cleanText.length < 2) return;

    // Check if this is an explicit interrupt command ("stop", "wait", "kira stop", etc.)
    const isPureInterrupt = /^(hey\s+kira\s+|kira\s+)?(wait|stop|hold\s*(on|up)|pause|quiet|cancel|listen|shut\s*up|silence|halt|shh+)(\s+(please|now|kira|wait|stop))?[.!]?$/i.test(cleanText);
    if (isPureInterrupt) {
      console.log("[Kira Voice] Recognized pure voice interrupt command:", cleanText);
      stopSpeaking();
      isPausedForExecution = false;
      updateFloatStatus("Stopped");
      if (statusLabel) {
        statusLabel.textContent = "Kira Voice: Stopped.";
      }
      activeInterimText = "";
      lastStopInterruptTime = Date.now();
      return;
    }

    // Suppress submission if user recently issued a stop/wait interrupt within 1.5 seconds
    if (Date.now() - lastStopInterruptTime < 1500) {
      return;
    }

    if (isPausedForExecution || isSpeaking) return;

    if (interimCommitTimer) {
      clearTimeout(interimCommitTimer);
      interimCommitTimer = null;
    }
    activeInterimText = "";

    console.log("[Kira Voice] Realtime voice command committed:", cleanText);
    isPausedForExecution = true;
    updateFloatStatus("Thinking...");
    textareaEl.value = cleanText;
    autoResizeTextarea();
    if (statusLabel) {
      statusLabel.textContent = "Processing: " + (cleanText.length > 30 ? cleanText.slice(0, 30) + "..." : cleanText);
    }
    triggerSubmit();

    if (executionWatchdogTimer) clearTimeout(executionWatchdogTimer);
    executionWatchdogTimer = setTimeout(() => {
      if (isVoiceModeActive && isPausedForExecution && !isSpeaking) {
        resumeListening();
      }
    }, 20000);
  }

  function initSpeechRecognizer() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn("[Kira Voice] SpeechRecognition API not supported in this browser window, using audio capture fallback.");
      return null;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = voiceSettings.recognitionLang || "en-IN";

      rec.onstart = () => {
        isListening = true;
        updateFloatStatus("Listening...");
        if (statusLabel) {
          statusLabel.textContent = "Kira Voice: Listening... (speak anytime)";
        }
      };

      rec.onresult = (event) => {
        if (!isVoiceModeActive) return;

        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcript = item[0]?.transcript || "";
          if (item.isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        interim = normalizeVoiceTranscript(interim);
        final = normalizeVoiceTranscript(final);

        const heardPhrase = (final || interim).trim();
        if (!heardPhrase) return;

        const isExplicitStop = /\b(wait|stop|hold\s*(on|up)|pause|quiet|cancel|listen|shut\s*up|silence|halt|shh+)\b/i.test(heardPhrase);

        // Case 1: Kira is speaking - immediate barge-in interruption!
        if (isSpeaking) {
          // Acoustic echo suppression: check if heard audio is just Kira's own voice coming from speakers
          const heardWords = heardPhrase.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).filter(Boolean);
          const activeSpeechWords = (activeSpeechUtteranceText || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).filter(Boolean);

          let matchingWords = 0;
          for (const w of heardWords) {
            if (activeSpeechWords.includes(w)) {
              matchingWords++;
            }
          }
          const isSpeakerEcho = heardWords.length > 0 && (matchingWords / heardWords.length) >= 0.5;

          if (isExplicitStop) {
            console.log("[Kira Voice] User voice explicitly stopped Kira speech:", heardPhrase);
            stopSpeaking();
            updateFloatStatus("Stopped");
            if (statusLabel) {
              statusLabel.textContent = "Kira Voice: Stopped.";
            }
            activeInterimText = "";
            lastStopInterruptTime = Date.now();
            return;
          }

          if (isSpeakerEcho) {
            // Speaker echo detected from output audio, ignore to prevent self-interruption
            return;
          }

          // User spoke something else while Kira was speaking (e.g. brand new command)
          if (heardWords.length >= 2) {
            console.log("[Kira Voice] User speech interrupted Kira speech with new command:", heardPhrase);
            stopSpeaking();
          } else {
            return;
          }
        }

        // Case 2: Task is executing or thinking (isPausedForExecution is true, but not speaking)
        if (isPausedForExecution) {
          if (isExplicitStop) {
            console.log("[Kira Voice] User said stop/wait during execution:", heardPhrase);
            isPausedForExecution = false;
            stopSpeaking();
            hideSkeleton();
            if (typeof finishActiveTypewriter === "function") finishActiveTypewriter();
            updateFloatStatus("Stopped");
            if (statusLabel) {
              statusLabel.textContent = "Kira Voice: Execution paused/stopped.";
            }
            activeInterimText = "";
            lastStopInterruptTime = Date.now();
            return;
          }
          // Ignore other non-stop background speech while task is executing
          return;
        }

        if (interim) {
          activeInterimText = interim.trim();
          const displayTxt = activeInterimText.length > 25 ? activeInterimText.slice(0, 22) + "..." : activeInterimText;
          updateFloatStatus("Hearing: " + displayTxt);
          if (statusLabel) {
            statusLabel.textContent = "Hearing: " + activeInterimText;
          }

          // Debounce / silence commit: if user stops speaking for 750ms, auto-commit the spoken phrase!
          if (interimCommitTimer) clearTimeout(interimCommitTimer);
          interimCommitTimer = setTimeout(() => {
            if (activeInterimText && !isPausedForExecution && !isSpeaking) {
              const textToCommit = activeInterimText;
              activeInterimText = "";
              commitVoiceText(textToCommit);
            }
          }, 750);
        }

        if (final) {
          if (interimCommitTimer) {
            clearTimeout(interimCommitTimer);
            interimCommitTimer = null;
          }
          const finalText = final.trim();
          console.log("[Kira Voice] Streaming speech final phrase:", finalText);
          activeInterimText = "";
          commitVoiceText(finalText);
        }
      };

      rec.onerror = (event) => {
        if (event.error === "no-speech") {
          return;
        }
        console.warn("[Kira Voice] Speech recognition notice:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          updateFloatStatus("Mic blocked");
          if (statusLabel) {
            statusLabel.textContent = "Kira Voice: Microphone access blocked.";
          }
        }
      };

      rec.onend = () => {
        isListening = false;
        if (interimCommitTimer) {
          clearTimeout(interimCommitTimer);
          interimCommitTimer = null;
        }
        // If there was uncommitted interim speech when recognition stopped, commit it now!
        if (activeInterimText && !isPausedForExecution && !isSpeaking) {
          const textToCommit = activeInterimText;
          activeInterimText = "";
          commitVoiceText(textToCommit);
        }

        // Keep continuously listening if voice mode is still active (even while speaking, for barge-in!)
        if (isVoiceModeActive) {
          if (recognitionRestartTimer) clearTimeout(recognitionRestartTimer);
          recognitionRestartTimer = setTimeout(() => {
            if (isVoiceModeActive) {
              if (!speechRecognizer) {
                speechRecognizer = initSpeechRecognizer();
              }
              if (speechRecognizer) {
                try {
                  speechRecognizer.start();
                } catch {}
              }
            }
          }, 200);
        }
      };

      return rec;
    } catch (err) {
      console.warn("[Kira Voice] Failed to initialize SpeechRecognition:", err);
      return null;
    }
  }

  async function commitVoiceRecording() {
    // If native streaming speechRecognizer is active, let it handle transcription
    if (speechRecognizer) {
      pcmChunks = [];
      return;
    }

    if (pcmChunks.length === 0 || isTranscribing || isPausedForExecution || isSpeaking) return;

    let totalLen = 0;
    for (let i = 0; i < pcmChunks.length; i++) {
      totalLen += pcmChunks[i].length;
    }

    if (totalLen < 3200) {
      pcmChunks = [];
      updateFloatStatus("Listening...");
      return;
    }

    const merged = new Float32Array(totalLen);
    let offset = 0;
    for (let i = 0; i < pcmChunks.length; i++) {
      merged.set(pcmChunks[i], offset);
      offset += pcmChunks[i].length;
    }
    pcmChunks = [];

    isTranscribing = true;
    updateFloatStatus("Transcribing...");
    if (statusLabel) {
      statusLabel.textContent = "Kira is transcribing your voice...";
    }

    try {
      const uint8 = new Uint8Array(merged.buffer);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < uint8.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, uint8.subarray(i, i + chunkSize));
      }
      const base64Audio = btoa(binary);

      let resultText = "";
      if (typeof window.kira_transcribe_audio === "function") {
        const res = await window.kira_transcribe_audio(base64Audio);
        if (res && res.success && res.text) {
          resultText = res.text.trim();
        }
      }

      if (resultText && resultText.length > 0) {
        commitVoiceText(resultText);
      } else {
        updateFloatStatus("Listening...");
        if (statusLabel) {
          statusLabel.textContent = "Kira Voice: Listening... (speak anytime)";
        }
      }
    } catch (err) {
      console.error("[Kira Voice] Speech transcription fallback error:", err);
      updateFloatStatus("Listening...");
    } finally {
      isTranscribing = false;
    }
  }

  function renderWaveLoop() {
    if (!isVoiceModeActive) return;

    if (waveCanvas && waveCtx) {
      const width = waveCanvas.width;
      const height = waveCanvas.height;
      waveCtx.clearRect(0, 0, width, height);

      let timeData = null;
      let freqData = null;
      let rms = 0;

      if (analyserNode) {
        timeData = new Uint8Array(analyserNode.fftSize);
        freqData = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteTimeDomainData(timeData);
        analyserNode.getByteFrequencyData(freqData);

        let sumSquares = 0;
        for (let k = 0; k < timeData.length; k++) {
          const norm = (timeData[k] - 128) / 128;
          sumSquares += norm * norm;
        }
        rms = Math.sqrt(sumSquares / timeData.length);
      }

      const numBars = 9;
      const barWidth = 3;
      const barGap = 3.5;
      const totalWidth = numBars * barWidth + (numBars - 1) * barGap;
      const startX = (width - totalWidth) / 2;
      const centerY = height / 2;
      const now = Date.now();

      // Dynamic sensitivity for visualizer waves:
      // Sensitive down to 0.004 RMS so normal speech visibly moves the red waves!
      const isUserSpeaking = isRecordingSpeech || (rms > Math.max(0.004, noiseFloor * 1.5));

      for (let i = 0; i < numBars; i++) {
        let targetHeight = 3.5; // Calm baseline

        if (isSpeaking) {
          // Dynamic rhythm reflecting Kira companion speech cadence
          const offset = i * 0.65;
          const pulse = Math.abs(Math.sin(now * 0.008 + offset)) * Math.cos(now * 0.004 + offset * 0.5);
          const centerFactor = 1 - Math.abs(i - 4) / 5.5;
          targetHeight = 4 + Math.abs(pulse) * centerFactor * 16;
        } else if (isUserSpeaking) {
          // Real live microphone speech reaction (vocal formant spectrum 180Hz - 1700Hz)
          const binVal = (freqData ? freqData[i + 1] : 0) / 255;
          const centerFactor = 1 - Math.abs(i - 4) / 5.5;
          const energy = Math.min(1.0, Math.max(0, (rms - noiseFloor) * 8.0));
          targetHeight = 3.5 + (energy * 0.7 + binVal * 0.3) * centerFactor * 20;
        } else {
          // Silent resting baseline: steady 3.5px with gentle organic micro-breathe
          targetHeight = 3.5 + 0.35 * Math.sin(now * 0.0025 + i * 0.6);
        }

        targetHeight = Math.max(3, Math.min(22, targetHeight));
        // Responsive lerp: fast attack, smooth decay
        smoothedHeights[i] += (targetHeight - smoothedHeights[i]) * 0.36;
        const h = smoothedHeights[i];

        // Clean, consistent crimson red (#ef4444)
        waveCtx.fillStyle = "#ef4444";
        const x = startX + i * (barWidth + barGap);
        const y = centerY - h / 2;
        const radius = barWidth / 2;

        waveCtx.beginPath();
        if (typeof waveCtx.roundRect === "function") {
          waveCtx.roundRect(x, y, barWidth, h, radius);
        } else {
          waveCtx.rect(x, y, barWidth, h);
        }
        waveCtx.fill();
      }
    }

    waveAnimFrameId = requestAnimationFrame(renderWaveLoop);
  }

  function stopWaveVisualizer() {
    if (waveAnimFrameId) {
      cancelAnimationFrame(waveAnimFrameId);
      waveAnimFrameId = null;
    }
    if (floatWidgetEl) {
      floatWidgetEl.style.display = "none";
    }
    if (audioCaptureNode) {
      try { audioCaptureNode.disconnect(); } catch {}
      audioCaptureNode = null;
    }
    if (audioSourceNode) {
      try { audioSourceNode.disconnect(); } catch {}
      audioSourceNode = null;
    }
    if (analyserNode) {
      try { analyserNode.disconnect(); } catch {}
      analyserNode = null;
    }
    if (audioDestinationNode) {
      try { audioDestinationNode.disconnect(); } catch {}
      audioDestinationNode = null;
    }
    pcmChunks = [];
    preRollBuffer = [];
    isRecordingSpeech = false;
    isTranscribing = false;
    if (micMediaStream) {
      try {
        micMediaStream.getTracks().forEach((t) => t.stop());
      } catch {}
      micMediaStream = null;
    }
    if (audioContext && audioContext.state !== "closed") {
      try {
        audioContext.close();
      } catch {}
      audioContext = null;
    }
    window._kiraCaptureNode = null;
    window._kiraAudioSource = null;
    window._kiraAnalyser = null;
    window._kiraAudioDest = null;
    window._kiraAudioCtx = null;
    window._kiraMediaStream = null;
  }

  // --------------------------------------------------------------------------
  // Synchronization & Switch State Management
  // --------------------------------------------------------------------------
  function updateToggleUI(isActive, isCurrentlySpeaking = false) {
    let icon = ICONS.micOff;
    if (isCurrentlySpeaking) {
      icon = ICONS.waveform || ICONS.mic;
    } else if (isActive) {
      icon = ICONS.mic;
    }

    if (voiceToggleBtn) {
      voiceToggleBtn.classList.toggle("active", isActive);
      voiceToggleBtn.setAttribute("aria-checked", isActive ? "true" : "false");
      voiceToggleBtn.title = isActive
        ? (isCurrentlySpeaking ? "Kira Voice: Speaking..." : "Kira Voice: Continuous Mic Listening (Alt+V)")
        : "Kira Voice: Click to Enable Continuous Mic (Alt+V)";

      const iconSpan = voiceToggleBtn.querySelector(".as-som-switch-icon");
      if (iconSpan) {
        iconSpan.innerHTML = icon;
      }
    }

    if (railVoiceToggleBtn) {
      railVoiceToggleBtn.innerHTML = icon;
      railVoiceToggleBtn.style.color = isActive ? "#ef4444" : "";
      railVoiceToggleBtn.title = isActive ? "Kira Voice: Continuous Mic (Alt+V)" : "Kira Voice: Mic Off (Alt+V)";
    }

    const autoSpeakToggle = sidebar.querySelector("#as-setting-toggle-autospeak");
    if (autoSpeakToggle) {
      autoSpeakToggle.classList.toggle("active", isActive);
      autoSpeakToggle.setAttribute("aria-checked", isActive ? "true" : "false");
    }
  }

  function setVoiceActive(isActive) {
    isVoiceModeActive = Boolean(isActive);
    voiceSettings.autoSpeak = isVoiceModeActive;

    updateToggleUI(isVoiceModeActive, false);

    if (isVoiceModeActive) {
      isPausedForExecution = false;
      startContinuousListening();
      if (statusLabel) {
        statusLabel.textContent = "Kira Voice: Listening... (speak anytime)";
      }
    } else {
      isPausedForExecution = false;
      stopContinuousListening();
      stopWaveVisualizer();
      stopSpeaking();
      if (statusLabel && (statusLabel.textContent.includes("Listening") || statusLabel.textContent.includes("speaking") || statusLabel.textContent.includes("voice command"))) {
        statusLabel.textContent = "Ready. Type a prompt below to automate.";
      }
    }

    if (typeof window.kira_save_voice_settings === "function") {
      window.kira_save_voice_settings(voiceSettings);
    }
  }

  // Load voice settings from backend
  async function loadVoiceSettings() {
    try {
      if (typeof window.kira_get_voice_settings === "function") {
        const settings = await window.kira_get_voice_settings();
        if (settings) {
          voiceSettings = { ...voiceSettings, ...settings };
          // Initialize switch state
          if (voiceSettings.autoSpeak) {
            setVoiceActive(true);
          } else {
            updateToggleUI(false, false);
          }
          syncVoiceSettingsUI();
        }
      }
    } catch (e) {
      console.warn("Could not load Kira voice settings:", e);
    }
  }

  function syncVoiceSettingsUI() {
    const voiceSelect = sidebar.querySelector("#as-voice-select");
    const speedSlider = sidebar.querySelector("#as-voice-speed-slider");
    const speedVal = sidebar.querySelector("#as-voice-speed-val");
    const langSelect = sidebar.querySelector("#as-voice-lang-select");
    const engineSelect = sidebar.querySelector("#as-voice-engine-select");

    if (voiceSelect && voiceSettings.activeVoice) {
      voiceSelect.value = voiceSettings.activeVoice;
    }
    if (speedSlider) {
      speedSlider.value = voiceSettings.speed || 1.0;
    }
    if (speedVal) {
      speedVal.textContent = (voiceSettings.speed || 1.0).toFixed(2) + "x";
    }
    if (langSelect && voiceSettings.recognitionLang) {
      langSelect.value = voiceSettings.recognitionLang;
    }
    if (engineSelect && voiceSettings.ttsEngine) {
      engineSelect.value = voiceSettings.ttsEngine;
    }
  }

  loadVoiceSettings();

  // Toggle button event listeners
  if (voiceToggleBtn) {
    voiceToggleBtn.addEventListener("click", () => {
      setVoiceActive(!isVoiceModeActive);
    });
  }

  if (railVoiceToggleBtn) {
    railVoiceToggleBtn.addEventListener("click", () => {
      setVoiceActive(!isVoiceModeActive);
    });
  }

  // Keyboard shortcut Alt+V to toggle Kira continuous voice mode
  document.addEventListener("keydown", (e) => {
    if ((e.altKey || (e.ctrlKey && e.shiftKey)) && (e.key === "v" || e.key === "V")) {
      e.preventDefault();
      setVoiceActive(!isVoiceModeActive);
    }
  });

  // --------------------------------------------------------------------------
  // 1. Text-to-Speech (Kira Speaking Short, Precise Human Response)
  // --------------------------------------------------------------------------
  async function speakText(text, triggerBtn = null, onSpokenCallback = null) {
    if (!text || typeof text !== "string") return;

    // Toggle stop if clicking the same speaking button
    if (activeSpeakingBtn === triggerBtn && triggerBtn && isSpeaking) {
      stopSpeaking();
      return;
    }

    stopSpeaking();
    isSpeaking = true;

    // Ensure microphone remains active during speech output for user barge-in / interrupt ("wait", "stop")
    if (isVoiceModeActive) {
      if (!speechRecognizer) {
        speechRecognizer = initSpeechRecognizer();
      }
      if (speechRecognizer) {
        try {
          speechRecognizer.lang = voiceSettings.recognitionLang || "en-IN";
          speechRecognizer.start();
        } catch {}
      }
    }

    if (triggerBtn) {
      activeSpeakingBtn = triggerBtn;
      triggerBtn.classList.add("as-speaking");
      triggerBtn.innerHTML = ICONS.waveform || ICONS.volume2;
    }

    updateToggleUI(isVoiceModeActive, true);
    updateFloatStatus("Kira Speaking...");

    // FAST MODE: Instant Natural Speech via Browser Web Speech API (<50ms turnaround)
    if (voiceSettings.ttsEngine === "browser" && "speechSynthesis" in window) {
      try {
        // Strip markdown formatting, URLs, code blocks, bullet points, numbers, and symbols
        let cleanText = text
          .split(String.fromCharCode(96, 96, 96)).filter((_, idx) => idx % 2 === 0).join(" ")
          .replace(/\\[([^\\]]+)\\]\\([^)]+\\)/g, "$1")
          .replace(/[*_#~]/g, "")
          .replace(new RegExp(String.fromCharCode(96), "g"), "")
          .replace(/https?:\\/\\/\\S+/g, "")
          .replace(/^[\\s•\\-\\*\\d\\.\\)\\:]+/gm, "")
          .replace(/\\n+/g, " ")
          .trim();

        // Conversational length: keep up to 3 natural sentences or ~280 characters
        const sentences = cleanText.split(/(?<=[.?!])\\s+/);
        if (sentences.length > 3) {
          cleanText = sentences.slice(0, 3).join(" ");
        }
        if (cleanText.length > 300) {
          cleanText = cleanText.slice(0, 290).trim() + "...";
        }
        if (!cleanText) cleanText = "All set. Task complete.";
        activeSpeechUtteranceText = cleanText;

        if (statusLabel && !activeSpeakingBtn) {
          statusLabel.textContent = "Kira is speaking...";
        }

        if (typeof onSpokenCallback === "function") {
          onSpokenCallback(cleanText);
        }

        const utter = new SpeechSynthesisUtterance(cleanText);
        activeSpeechUtterance = utter; // Prevent V8 garbage collection bug in Chromium
        window.__kiraActiveUtterance = utter;
        speakingStartTime = Date.now();

        utter.rate = voiceSettings.speed || 1.0;
        utter.lang = voiceSettings.recognitionLang || "en-IN";

        // Select best natural voice available in browser
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const matching = voices.find(v => v.lang === utter.lang) ||
                         voices.find(v => v.lang.startsWith(utter.lang.slice(0, 2))) ||
                         voices.find(v => v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Online")) ||
                         voices[0];
          if (matching) utter.voice = matching;
        }

        // Keep-alive timer to prevent Chromium from pausing or freezing speech output mid-utterance
        if (speechKeepAliveInterval) clearInterval(speechKeepAliveInterval);
        speechKeepAliveInterval = setInterval(() => {
          if (!isSpeaking) {
            clearInterval(speechKeepAliveInterval);
            speechKeepAliveInterval = null;
          } else if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        }, 300);

        utter.onend = () => {
          if (speechKeepAliveInterval) {
            clearInterval(speechKeepAliveInterval);
            speechKeepAliveInterval = null;
          }
          activeSpeechUtterance = null;
          window.__kiraActiveUtterance = null;
          stopSpeaking();
        };

        utter.onerror = (err) => {
          if (speechKeepAliveInterval) {
            clearInterval(speechKeepAliveInterval);
            speechKeepAliveInterval = null;
          }
          activeSpeechUtterance = null;
          window.__kiraActiveUtterance = null;
          if (err.error !== "interrupted" && err.error !== "canceled") {
            console.warn("[Kira Voice] SpeechSynthesis playback notice:", err);
          }
          stopSpeaking();
        };

        // Cancel previous speech if actively speaking, then speak with a micro-tick
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
        setTimeout(() => {
          if (isSpeaking) {
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
            window.speechSynthesis.speak(utter);
          }
        }, 40);
        return;
      } catch (browserSynthErr) {
        console.warn("[Kira Voice] Browser speech synthesis fallback:", browserSynthErr);
      }
    }

    if (speechTimeoutTimer) clearTimeout(speechTimeoutTimer);
    speechTimeoutTimer = setTimeout(() => {
      console.warn("[Kira Voice] Speech synthesis or playback timeout fallback.");
      stopSpeaking();
    }, 12000);

    try {
      if (typeof window.kira_synthesize_speech !== "function") {
        console.warn("window.kira_synthesize_speech is not exposed.");
        stopSpeaking();
        return;
      }

      if (statusLabel && !activeSpeakingBtn) {
        statusLabel.textContent = "Kira is speaking...";
      }

      // Synthesize short, human-like voice response via dedicated companion VoiceAgent
      const res = await window.kira_synthesize_speech(text, {
        userCommand: lastSubmittedCommand || "",
        voice: voiceSettings.activeVoice || "af_heart",
        speed: voiceSettings.speed || 1.0,
        distill: true,
      });

      if (speechTimeoutTimer) {
        clearTimeout(speechTimeoutTimer);
        speechTimeoutTimer = null;
      }

      if (!res || !res.success || !res.audioUrl) {
        console.warn("Speech synthesis returned no audio:", res?.error);
        stopSpeaking();
        return;
      }

      // Notify caller of distilled spoken text so the UI can display the voice pill
      if (typeof onSpokenCallback === "function" && res.spokenText) {
        onSpokenCallback(res.spokenText);
      }
      activeSpeechUtteranceText = res.spokenText || text;

      const audio = new Audio(res.audioUrl);
      activeAudioPlayer = audio;

      audio.onended = () => {
        stopSpeaking();
      };

      audio.onerror = (err) => {
        console.error("Audio playback error:", err);
        stopSpeaking();
      };

      await audio.play();
    } catch (err) {
      console.error("Speech playback error:", err);
      stopSpeaking();
    }
  }

  function stopSpeaking() {
    isSpeaking = false;
    activeSpeechUtteranceText = "";
    if (speechKeepAliveInterval) {
      clearInterval(speechKeepAliveInterval);
      speechKeepAliveInterval = null;
    }
    activeSpeechUtterance = null;
    window.__kiraActiveUtterance = null;
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    if (speechTimeoutTimer) {
      clearTimeout(speechTimeoutTimer);
      speechTimeoutTimer = null;
    }
    if (executionWatchdogTimer) {
      clearTimeout(executionWatchdogTimer);
      executionWatchdogTimer = null;
    }
    if (activeAudioPlayer) {
      try {
        activeAudioPlayer.pause();
        activeAudioPlayer.currentTime = 0;
      } catch {}
      activeAudioPlayer = null;
    }
    if (activeSpeakingBtn) {
      activeSpeakingBtn.classList.remove("as-speaking");
      activeSpeakingBtn.innerHTML = ICONS.volume2;
      activeSpeakingBtn = null;
    }

    updateToggleUI(isVoiceModeActive, false);

    // If continuous voice mode is active, re-arm listening after acoustic echo decay
    if (isVoiceModeActive) {
      isPausedForExecution = false;
      updateFloatStatus("Listening...");
      if (recognitionRestartTimer) clearTimeout(recognitionRestartTimer);
      recognitionRestartTimer = setTimeout(() => {
        if (isVoiceModeActive && !isSpeaking) {
          startContinuousListening();
        }
      }, 350);
      if (statusLabel) {
        statusLabel.textContent = "Kira Voice: Listening... (speak anytime)";
      }
    } else {
      updateFloatStatus("Off");
      if (statusLabel && statusLabel.textContent === "Kira is speaking...") {
        statusLabel.textContent = "Ready. Type a prompt below to automate.";
      }
    }
  }

  function resumeListening() {
    if (!isVoiceModeActive || isSpeaking) return;
    if (executionWatchdogTimer) {
      clearTimeout(executionWatchdogTimer);
      executionWatchdogTimer = null;
    }
    isPausedForExecution = false;
    updateFloatStatus("Listening...");
    startContinuousListening();
    if (statusLabel && (statusLabel.textContent.includes("Processing") || statusLabel.textContent.includes("Thinking"))) {
      statusLabel.textContent = "Kira Voice: Listening... (speak anytime)";
    }
  }

  // Interrupt Kira speech when user types in textarea or presses Esc
  textareaEl.addEventListener("input", () => {
    if (activeAudioPlayer && !activeAudioPlayer.paused) {
      stopSpeaking();
    }
    if ("speechSynthesis" in window && window.speechSynthesis.speaking) {
      stopSpeaking();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if ((activeAudioPlayer && !activeAudioPlayer.paused) || ("speechSynthesis" in window && window.speechSynthesis.speaking)) {
        stopSpeaking();
      }
    }
  });

  // --------------------------------------------------------------------------
  // 2. Speech-to-Text (Continuous Realtime Streaming Listening)
  // --------------------------------------------------------------------------
  function startContinuousListening() {
    isListening = true;
    pcmChunks = [];
    isRecordingSpeech = false;
    isTranscribing = false;

    // 1. Start live audio wave visualizer (microphone Web Audio)
    startWaveVisualizer();

    // 2. Start native streaming speech recognition
    if (!speechRecognizer) {
      speechRecognizer = initSpeechRecognizer();
    }
    if (speechRecognizer) {
      try {
        speechRecognizer.lang = voiceSettings.recognitionLang || "en-IN";
        speechRecognizer.start();
      } catch (err) {
        console.debug("[Kira Voice] Recognizer start notice:", err);
      }
    }
  }

  function stopContinuousListening() {
    isListening = false;
    pcmChunks = [];
    isRecordingSpeech = false;
    isTranscribing = false;

    if (recognitionRestartTimer) {
      clearTimeout(recognitionRestartTimer);
      recognitionRestartTimer = null;
    }

    if (speechRecognizer) {
      try {
        speechRecognizer.stop();
      } catch {}
      speechRecognizer = null;
    }

    stopWaveVisualizer();
  }

  // --------------------------------------------------------------------------
  // 3. Settings UI Event Handlers
  // --------------------------------------------------------------------------
  const voiceSelect = sidebar.querySelector("#as-voice-select");
  if (voiceSelect) {
    voiceSelect.addEventListener("change", (e) => {
      voiceSettings.activeVoice = e.target.value;
      if (typeof window.kira_save_voice_settings === "function") {
        window.kira_save_voice_settings(voiceSettings);
      }
    });
  }

  const langSelect = sidebar.querySelector("#as-voice-lang-select");
  if (langSelect) {
    langSelect.addEventListener("change", (e) => {
      voiceSettings.recognitionLang = e.target.value;
      if (speechRecognizer) {
        speechRecognizer.lang = voiceSettings.recognitionLang;
      }
      if (typeof window.kira_save_voice_settings === "function") {
        window.kira_save_voice_settings(voiceSettings);
      }
    });
  }

  const engineSelect = sidebar.querySelector("#as-voice-engine-select");
  if (engineSelect) {
    engineSelect.addEventListener("change", (e) => {
      voiceSettings.ttsEngine = e.target.value;
      if (typeof window.kira_save_voice_settings === "function") {
        window.kira_save_voice_settings(voiceSettings);
      }
    });
  }

  const autoSpeakToggle = sidebar.querySelector("#as-setting-toggle-autospeak");
  if (autoSpeakToggle) {
    autoSpeakToggle.addEventListener("click", () => {
      setVoiceActive(!autoSpeakToggle.classList.contains("active"));
    });
  }

  const speedSlider = sidebar.querySelector("#as-voice-speed-slider");
  const speedVal = sidebar.querySelector("#as-voice-speed-val");
  if (speedSlider) {
    speedSlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      voiceSettings.speed = val;
      if (speedVal) speedVal.textContent = val.toFixed(2) + "x";
    });
    speedSlider.addEventListener("change", () => {
      if (typeof window.kira_save_voice_settings === "function") {
        window.kira_save_voice_settings(voiceSettings);
      }
    });
  }

  const testVoiceBtn = sidebar.querySelector("#as-btn-test-voice");
  if (testVoiceBtn) {
    testVoiceBtn.addEventListener("click", () => {
      speakText("Hello! I am Kira, your autonomous browser companion. All systems are operational.", testVoiceBtn);
    });
  }

  // Expose Kira voice API globally inside sidebar
  window.kiraVoice = {
    speak: speakText,
    stop: stopSpeaking,
    isSpeaking: () => isSpeaking || !!(activeAudioPlayer && !activeAudioPlayer.paused),
    isVoiceActive: () => isVoiceModeActive,
    getSettings: () => voiceSettings,
    setSettings: (s) => { voiceSettings = { ...voiceSettings, ...s }; },
    setActive: setVoiceActive,
    startListening: startContinuousListening,
    stopListening: stopContinuousListening,
    resumeListening: resumeListening,
  };
  `;
}
