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
  let voiceSettings = {
    activeVoice: "af_heart",
    speed: 1.0,
    autoSpeak: false,
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
          audioContext = new AudioCtx();
        }
      }
      if (audioContext && audioContext.state === "suspended") {
        await audioContext.resume();
      }

      if (!micMediaStream || !micMediaStream.active) {
        micMediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: false,
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
        const inputSampleRate = audioContext.sampleRate;
        const ratio = inputSampleRate / 16000;
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

          // Downsample frame to 16kHz Float32 PCM
          const targetSamples = Math.round(channelData.length / ratio);
          const downsampled = new Float32Array(targetSamples);
          for (let k = 0; k < targetSamples; k++) {
            const origIdx = k * ratio;
            const lower = Math.floor(origIdx);
            const upper = Math.min(lower + 1, channelData.length - 1);
            const weight = origIdx - lower;
            downsampled[k] = channelData[lower] * (1 - weight) + channelData[upper] * weight;
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
            const totalEstimatedSamples = pcmChunks.length * targetSamples;
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

  async function commitVoiceRecording() {
    if (pcmChunks.length === 0 || isTranscribing || isPausedForExecution || isSpeaking) return;

    let totalLen = 0;
    for (let i = 0; i < pcmChunks.length; i++) {
      totalLen += pcmChunks[i].length;
    }

    // Require at least 0.2s of audio (3200 samples at 16kHz)
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
        console.log("[Kira Voice] Whisper transcribed:", resultText);
        isPausedForExecution = true;
        updateFloatStatus("Thinking...");
        textareaEl.value = resultText;
        autoResizeTextarea();
        if (statusLabel) {
          statusLabel.textContent = "Processing: " + resultText.slice(0, 30) + "...";
        }
        triggerSubmit();

        if (executionWatchdogTimer) clearTimeout(executionWatchdogTimer);
        executionWatchdogTimer = setTimeout(() => {
          if (isVoiceModeActive && isPausedForExecution && !isSpeaking) {
            resumeListening();
          }
        }, 20000);
      } else {
        updateFloatStatus("Listening...");
        if (statusLabel) {
          statusLabel.textContent = "Kira Voice: Listening... (speak anytime)";
        }
      }
    } catch (err) {
      console.error("[Kira Voice] Speech transcription error:", err);
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

    if (voiceSelect && voiceSettings.activeVoice) {
      voiceSelect.value = voiceSettings.activeVoice;
    }
    if (speedSlider) {
      speedSlider.value = voiceSettings.speed || 1.0;
    }
    if (speedVal) {
      speedVal.textContent = (voiceSettings.speed || 1.0).toFixed(2) + "x";
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
    if (activeAudioPlayer && !activeAudioPlayer.paused && activeSpeakingBtn === triggerBtn && triggerBtn) {
      stopSpeaking();
      return;
    }

    stopSpeaking();
    isSpeaking = true;

    // Pause speech recognition while speaking to prevent microphone echo
    if (speechRecognizer) {
      try {
        speechRecognizer.stop();
      } catch {}
    }

    if (triggerBtn) {
      activeSpeakingBtn = triggerBtn;
      triggerBtn.classList.add("as-speaking");
      triggerBtn.innerHTML = ICONS.waveform || ICONS.volume2;
    }

    updateToggleUI(isVoiceModeActive, true);
    updateFloatStatus("Kira Speaking...");

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

    // If continuous voice mode is active, immediately re-arm silent listening!
    if (isVoiceModeActive) {
      isPausedForExecution = false;
      updateFloatStatus("Listening...");
      startContinuousListening();
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
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && activeAudioPlayer && !activeAudioPlayer.paused) {
      stopSpeaking();
    }
  });

  // --------------------------------------------------------------------------
  // 2. Speech-to-Text (Continuous Listening Loop via Local Whisper)
  // --------------------------------------------------------------------------
  function startContinuousListening() {
    isListening = true;
    pcmChunks = [];
    isRecordingSpeech = false;
    isTranscribing = false;
    startWaveVisualizer();
  }

  function stopContinuousListening() {
    isListening = false;
    pcmChunks = [];
    isRecordingSpeech = false;
    isTranscribing = false;
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
