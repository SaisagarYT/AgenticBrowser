"use strict";

/**
 * Kira Voice Manager
 * Handles Speech-to-Text (webkitSpeechRecognition) and Kokoro Text-to-Speech (HTML5 Audio).
 * Manages the Voice Toggle Switch (styled identical to the Visual Marks Eye Switch).
 */
export function getVoiceManagerCode() {
  return `
  // --------------------------------------------------------------------------
  // Kira Voice & Audio State
  // --------------------------------------------------------------------------
  let isListening = false;
  let speechRecognizer = null;
  let activeAudioPlayer = null;
  let activeSpeakingBtn = null;
  let voiceSettings = {
    activeVoice: "af_heart",
    speed: 1.0,
    autoSpeak: true,
  };

  // Voice Toggle Switch Elements (voiceToggleBtn and railVoiceToggleBtn are declared in controller scope)

  // --------------------------------------------------------------------------
  // Synchronization & Switch State Management
  // --------------------------------------------------------------------------
  function setVoiceActive(isActive) {
    voiceSettings.autoSpeak = isActive;

    const icon = isActive ? ICONS.volume2 : ICONS.volumeX;

    if (voiceToggleBtn) {
      voiceToggleBtn.classList.toggle("active", isActive);
      voiceToggleBtn.setAttribute("aria-checked", isActive ? "true" : "false");
      voiceToggleBtn.title = isActive ? "Kira Voice: Active (Alt+V)" : "Kira Voice: Muted (Alt+V)";
      const iconSpan = voiceToggleBtn.querySelector(".as-som-switch-icon");
      if (iconSpan) {
        iconSpan.innerHTML = icon;
      }
    }

    if (railVoiceToggleBtn) {
      railVoiceToggleBtn.innerHTML = icon;
      railVoiceToggleBtn.style.color = isActive ? "#facc15" : "";
      railVoiceToggleBtn.title = isActive ? "Kira Voice: Active (Alt+V)" : "Kira Voice: Muted (Alt+V)";
    }

    const autoSpeakToggle = sidebar.querySelector("#as-setting-toggle-autospeak");
    if (autoSpeakToggle) {
      autoSpeakToggle.classList.toggle("active", isActive);
      autoSpeakToggle.setAttribute("aria-checked", isActive ? "true" : "false");
    }

    if (!isActive) {
      stopSpeaking();
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
          setVoiceActive(voiceSettings.autoSpeak !== false);
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
      setVoiceActive(!voiceSettings.autoSpeak);
    });
  }

  if (railVoiceToggleBtn) {
    railVoiceToggleBtn.addEventListener("click", () => {
      setVoiceActive(!voiceSettings.autoSpeak);
    });
  }

  // Keyboard shortcut Alt+V to toggle Kira voice
  document.addEventListener("keydown", (e) => {
    if ((e.altKey || (e.ctrlKey && e.shiftKey)) && (e.key === "v" || e.key === "V")) {
      e.preventDefault();
      setVoiceActive(!voiceSettings.autoSpeak);
    }
  });

  // --------------------------------------------------------------------------
  // 1. Text-to-Speech (Kira Speaking)
  // --------------------------------------------------------------------------
  async function speakText(text, triggerBtn = null) {
    if (!text || typeof text !== "string") return;

    // Toggle stop/pause if clicking the same speaking button
    if (activeAudioPlayer && !activeAudioPlayer.paused && activeSpeakingBtn === triggerBtn && triggerBtn) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    if (triggerBtn) {
      activeSpeakingBtn = triggerBtn;
      triggerBtn.classList.add("as-speaking");
      triggerBtn.innerHTML = ICONS.waveform || ICONS.volume2;
    }

    // Indicate active speech on the voice toggle switch
    if (voiceToggleBtn) {
      const iconSpan = voiceToggleBtn.querySelector(".as-som-switch-icon");
      if (iconSpan) {
        iconSpan.innerHTML = ICONS.waveform || ICONS.volume2;
      }
    }

    try {
      if (typeof window.kira_synthesize_speech !== "function") {
        console.warn("window.kira_synthesize_speech is not exposed.");
        stopSpeaking();
        return;
      }

      if (statusLabel && !activeSpeakingBtn) {
        statusLabel.textContent = "Kira is speaking...";
      }

      const res = await window.kira_synthesize_speech(text, {
        voice: voiceSettings.activeVoice || "af_heart",
        speed: voiceSettings.speed || 1.0,
      });

      if (!res || !res.success || !res.audioUrl) {
        console.warn("Speech synthesis returned no audio:", res?.error);
        stopSpeaking();
        return;
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
    if (voiceToggleBtn) {
      const iconSpan = voiceToggleBtn.querySelector(".as-som-switch-icon");
      if (iconSpan) {
        iconSpan.innerHTML = voiceSettings.autoSpeak ? ICONS.volume2 : ICONS.volumeX;
      }
    }
    if (statusLabel && statusLabel.textContent === "Kira is speaking...") {
      statusLabel.textContent = "Ready. Type a prompt below to automate.";
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
  // 2. Speech-to-Text (Talking to Kira via Microphone)
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
      if (statusLabel) statusLabel.textContent = "Listening to your voice...";
      stopSpeaking();
    };

    rec.onresult = (event) => {
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

        // Auto-submit after 2.2 seconds of silence
        if (silenceTimer) clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          if (isListening && textareaEl.value.trim().length > 0) {
            stopListening();
            triggerSubmit();
          }
        }, 2200);
      }
    };

    rec.onerror = (event) => {
      console.warn("Speech recognition notice:", event.error);
      if (event.error !== "no-speech") {
        stopListening();
      }
    };

    rec.onend = () => {
      if (isListening) {
        stopListening();
      }
    };

    return rec;
  }

  function startListening() {
    if (!speechRecognizer) {
      speechRecognizer = setupSpeechRecognition();
    }
    if (!speechRecognizer) {
      setStatus("idle", "Speech recognition unavailable in this window.");
      return;
    }

    try {
      speechRecognizer.start();
    } catch (e) {
      console.warn("Could not start speech recognition:", e);
      stopListening();
    }
  }

  function stopListening() {
    isListening = false;
    if (speechRecognizer) {
      try {
        speechRecognizer.stop();
      } catch {}
    }
    if (statusLabel && statusLabel.textContent === "Listening to your voice...") {
      statusLabel.textContent = "Ready. Type a prompt below to automate.";
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
    getSettings: () => voiceSettings,
    setSettings: (s) => { voiceSettings = { ...voiceSettings, ...s }; },
    setActive: setVoiceActive,
    startListening,
    stopListening,
  };
  `;
}
