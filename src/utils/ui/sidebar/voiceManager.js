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
  let analyserNode = null;
  let micMediaStream = null;
  let waveAnimFrameId = null;
  let smoothedHeights = [4, 4, 4, 4, 4, 4, 4, 4, 4];

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
    const widget = getOrCreateFloatingWidget();
    widget.style.display = "flex";
    updateFloatStatus("Listening...");

    // Setup Web Audio Analyser
    try {
      if (!audioContext) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          audioContext = new AudioCtx();
        }
      }
      if (audioContext && audioContext.state === "suspended") {
        await audioContext.resume();
      }

      if (!micMediaStream && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        micMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
        if (micMediaStream && audioContext) {
          const source = audioContext.createMediaStreamSource(micMediaStream);
          analyserNode = audioContext.createAnalyser();
          analyserNode.fftSize = 64;
          analyserNode.smoothingTimeConstant = 0.8;
          source.connect(analyserNode);
        }
      }
    } catch (e) {
      console.warn("Could not attach audio analyser:", e);
    }

    renderWaveLoop();
  }

  function renderWaveLoop() {
    if (!isVoiceModeActive) return;

    if (waveCanvas && waveCtx) {
      const width = waveCanvas.width;
      const height = waveCanvas.height;
      waveCtx.clearRect(0, 0, width, height);

      let freqData = null;
      if (analyserNode) {
        freqData = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(freqData);
      }

      const numBars = 9;
      const barWidth = 3;
      const barGap = 3.5;
      const totalWidth = numBars * barWidth + (numBars - 1) * barGap;
      const startX = (width - totalWidth) / 2;
      const centerY = height / 2;
      const now = Date.now();

      for (let i = 0; i < numBars; i++) {
        let targetHeight = 4; // idle baseline

        if (isSpeaking) {
          // Subtle rhythmic animation during Kira speech
          const offset = i * 0.7;
          targetHeight = 5 + 10 * Math.abs(Math.sin(now * 0.009 + offset));
        } else if (freqData && freqData.length > 0) {
          // Real live mic acoustic volume
          const binIndex = Math.min(Math.floor((i / numBars) * (freqData.length * 0.6)), freqData.length - 1);
          const rawVal = freqData[binIndex] || 0;
          if (rawVal > 15) {
            targetHeight = Math.min(22, 4 + (rawVal / 255) * 18);
          } else {
            // Gentle organic idle wave breathing
            targetHeight = 3.5 + 2.5 * Math.abs(Math.sin(now * 0.004 + i * 0.5));
          }
        } else {
          // Fallback smooth sinusoidal breathing
          targetHeight = 3.5 + 2.5 * Math.abs(Math.sin(now * 0.004 + i * 0.5));
        }

        // Smooth lerp transition
        smoothedHeights[i] += (targetHeight - smoothedHeights[i]) * 0.28;
        const h = Math.max(3, smoothedHeights[i]);

        // Clean, consistent, professional red color
        waveCtx.fillStyle = "#ef4444";
        const x = startX + i * (barWidth + barGap);
        const y = centerY - h / 2;
        const radius = barWidth / 2;

        // Draw rounded bar
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
    if (micMediaStream) {
      try {
        micMediaStream.getTracks().forEach(t => t.stop());
      } catch {}
      micMediaStream = null;
    }
    if (audioContext && audioContext.state !== "closed") {
      try {
        audioContext.close();
      } catch {}
      audioContext = null;
    }
    analyserNode = null;
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
      startWaveVisualizer();
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
  // 2. Speech-to-Text (Hands-Free Continuous Listening Loop)
  // --------------------------------------------------------------------------
  function setupSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn("SpeechRecognition not supported in this browser environment.");
      return null;
    }

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    let silenceTimer = null;
    let baseTextBeforeSpeech = "";

    rec.onstart = () => {
      isListening = true;
      baseTextBeforeSpeech = textareaEl.value;
      if (!isSpeaking && !isPausedForExecution) {
        updateFloatStatus("Listening...");
        if (statusLabel) {
          statusLabel.textContent = "Kira Voice: Listening... (speak anytime)";
        }
      }
    };

    rec.onresult = (event) => {
      // Discard recognition while Kira is speaking or processing a task
      if (isSpeaking || isPausedForExecution) return;

      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const spoken = (finalTranscript + interimTranscript).trim();
      if (spoken) {
        const separator = baseTextBeforeSpeech && !baseTextBeforeSpeech.endsWith(" ") ? " " : "";
        textareaEl.value = baseTextBeforeSpeech + separator + spoken;
        autoResizeTextarea();
        textareaEl.scrollTop = textareaEl.scrollHeight;

        updateFloatStatus("Listening: " + spoken.slice(-20) + "...");
        if (statusLabel) {
          statusLabel.textContent = "Listening: " + spoken.slice(-35) + "...";
        }

        // Auto-submit after 1.8 seconds of natural conversational pause
        if (silenceTimer) clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          if (isVoiceModeActive && isListening && textareaEl.value.trim().length > 0) {
            isPausedForExecution = true;
            try {
              rec.stop();
            } catch {}
            updateFloatStatus("Thinking...");
            if (statusLabel) {
              statusLabel.textContent = "Processing voice command...";
            }
            triggerSubmit();
            baseTextBeforeSpeech = "";
          }
        }, 1800);
      }
    };

    rec.onerror = (event) => {
      // "no-speech" is normal when the room is silent — DO NOT stop!
      if (event.error === "no-speech") {
        return;
      }
      console.warn("Speech recognition notice:", event.error);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setVoiceActive(false);
        if (statusLabel) {
          statusLabel.textContent = "Microphone access was denied in browser permissions.";
        }
      }
    };

    rec.onend = () => {
      isListening = false;
      // ALWAYS-ON auto-rearm loop: if voice mode is enabled, keep listening!
      if (isVoiceModeActive && !isSpeaking && !isPausedForExecution) {
        if (restartTimeout) clearTimeout(restartTimeout);
        restartTimeout = setTimeout(() => {
          if (isVoiceModeActive && !isSpeaking && !isPausedForExecution) {
            try {
              rec.start();
            } catch {}
          }
        }, 120);
      }
    };

    return rec;
  }

  function startContinuousListening() {
    if (!speechRecognizer) {
      speechRecognizer = setupSpeechRecognition();
    }
    if (!speechRecognizer) {
      if (statusLabel) {
        statusLabel.textContent = "Speech recognition unavailable in this window.";
      }
      return;
    }

    try {
      speechRecognizer.start();
    } catch {}
  }

  function stopContinuousListening() {
    isListening = false;
    if (restartTimeout) clearTimeout(restartTimeout);
    if (speechRecognizer) {
      try {
        speechRecognizer.abort();
      } catch {}
    }
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
    isSpeaking: () => !!(activeAudioPlayer && !activeAudioPlayer.paused),
    isVoiceActive: () => isVoiceModeActive,
    getSettings: () => voiceSettings,
    setSettings: (s) => { voiceSettings = { ...voiceSettings, ...s }; },
    setActive: setVoiceActive,
    startListening: startContinuousListening,
    stopListening: stopContinuousListening,
  };
  `;
}
