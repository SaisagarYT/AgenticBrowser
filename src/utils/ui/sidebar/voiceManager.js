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
  let isPausedForExecution = Boolean(window.__IS_TASK_RUNNING__);
  let restartTimeout = null;
  let speechTimeoutTimer = null;
  let executionWatchdogTimer = null;
  let speechRecognizer = null;
  let activeAudioPlayer = null;
  let activeSpeakingBtn = null;
  let activeInterimText = "";
  let accumulatedFinalTranscript = "";
  let lastCommittedText = "";
  let lastCommittedTime = 0;
  let silenceCommitTimer = null;
  let recognitionRestartTimer = null;
  let activeSpeechUtterance = null;
  let speakingStartTime = 0;
  let speechKeepAliveInterval = null;
  let voiceSettings = {
    activeVoice: "af_heart",
    speed: 1.0,
    autoSpeak: false,
    recognitionLang: "en-IN",
    ttsEngine: "edge",
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

            // Commit when user pauses for 1400ms after speaking OR max utterance reaches 15s
            const elapsedSinceSpeech = Date.now() - lastSpeechTime;
            const totalEstimatedSamples = pcmChunks.length * downsampled.length;
            if ((elapsedSinceSpeech > 1400 && totalEstimatedSamples >= 3200) || totalEstimatedSamples > 240000) {
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

  function handleFastVoiceAction(rawText) {
    if (!rawText) return false;
    const lower = rawText.toLowerCase().trim().replace(/[.,?!]/g, "");

    // 1. Scroll actions
    if (/^(scroll\\s+(down|a\\s+bit\\s+down)|page\\s+down)$/i.test(lower)) {
      window.scrollBy({ top: window.innerHeight * 0.75, behavior: "smooth" });
      updateFloatStatus("Scrolled down");
      if (statusLabel) statusLabel.textContent = "Kira Voice: Scrolled down";
      return true;
    }
    if (/^(scroll\\s+(up|a\\s+bit\\s+up)|page\\s+up)$/i.test(lower)) {
      window.scrollBy({ top: -window.innerHeight * 0.75, behavior: "smooth" });
      updateFloatStatus("Scrolled up");
      if (statusLabel) statusLabel.textContent = "Kira Voice: Scrolled up";
      return true;
    }
    if (/^(scroll\\s+to\\s+(the\\s+)?(top|start)|go\\s+to\\s+(the\\s+)?top)$/i.test(lower)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      updateFloatStatus("Scrolled to top");
      if (statusLabel) statusLabel.textContent = "Kira Voice: Scrolled to top";
      return true;
    }
    if (/^(scroll\\s+to\\s+(the\\s+)?(bottom|end)|go\\s+to\\s+(the\\s+)?bottom)$/i.test(lower)) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      updateFloatStatus("Scrolled to bottom");
      if (statusLabel) statusLabel.textContent = "Kira Voice: Scrolled to bottom";
      return true;
    }

    // 2. Navigation actions
    if (/^(go\\s+back|history\\s+back|previous\\s+page)$/i.test(lower)) {
      updateFloatStatus("Going back");
      if (statusLabel) statusLabel.textContent = "Kira Voice: Going back";
      window.history.back();
      return true;
    }
    if (/^(go\\s+forward|history\\s+forward|next\\s+page)$/i.test(lower)) {
      updateFloatStatus("Going forward");
      if (statusLabel) statusLabel.textContent = "Kira Voice: Going forward";
      window.history.forward();
      return true;
    }
    if (/^(refresh(\\s+page)?|reload(\\s+page)?)$/i.test(lower)) {
      updateFloatStatus("Reloading");
      if (statusLabel) statusLabel.textContent = "Kira Voice: Reloading page";
      window.location.reload();
      return true;
    }

    // 3. Voice control
    if (/^(turn\\s+off\\s+voice|stop\\s+listening|mute\\s+voice|close\\s+voice(\\s+mode)?)$/i.test(lower)) {
      setVoiceActive(false);
      return true;
    }

    // 4. Voice speed & accent voice controls
    if (/^(speak\\s+faster|talk\\s+faster|increase\\s+voice\\s+speed)$/i.test(lower)) {
      voiceSettings.speed = Math.min(1.5, Math.round(((voiceSettings.speed || 1.0) + 0.15) * 100) / 100);
      syncVoiceSettingsUI();
      if (typeof window.kira_save_voice_settings === "function") window.kira_save_voice_settings(voiceSettings);
      speakText("I will speak a little faster now.");
      return true;
    }
    if (/^(speak\\s+slower|talk\\s+slower|decrease\\s+voice\\s+speed)$/i.test(lower)) {
      voiceSettings.speed = Math.max(0.7, Math.round(((voiceSettings.speed || 1.0) - 0.15) * 100) / 100);
      syncVoiceSettingsUI();
      if (typeof window.kira_save_voice_settings === "function") window.kira_save_voice_settings(voiceSettings);
      speakText("I will speak a bit slower for you.");
      return true;
    }
    if (/^(switch\\s+to\\s+indian(\\s+accent|\\s+voice|\\s+english)?|use\\s+indian(\\s+accent|\\s+voice))$/i.test(lower)) {
      voiceSettings.activeVoice = "in_neerja";
      voiceSettings.recognitionLang = "en-IN";
      syncVoiceSettingsUI();
      if (typeof window.kira_save_voice_settings === "function") window.kira_save_voice_settings(voiceSettings);
      speakText("Namaste! I have switched to my Indian English voice.");
      return true;
    }
    if (/^(switch\\s+to\\s+american(\\s+accent|\\s+voice|\\s+english)?|use\\s+american(\\s+accent|\\s+voice))$/i.test(lower)) {
      voiceSettings.activeVoice = "af_heart";
      voiceSettings.recognitionLang = "en-US";
      syncVoiceSettingsUI();
      if (typeof window.kira_save_voice_settings === "function") window.kira_save_voice_settings(voiceSettings);
      speakText("Hello! I have switched to my American English voice.");
      return true;
    }

    return false;
  }

  function normalizeVoiceText(raw) {
    if (!raw) return "";
    let t = raw.trim().replace(/\\s+/g, " ");
    t = t.replace(/^(?:hey\\s+kira|kira|hey\\s+browser|can\\s+you\\s+please|please|could\\s+you)\\s+/i, "").trim();
    const replacements = [
      [/\\b(?:a\\s+i|eye(?=\\s+(?:in\\s+a|in|model|agent|bubble|tech|trend|research)))\\b/gi, "AI"],
      [/\\b(?:a\\s+i)\\b/gi, "AI"],
      [/\\b(?:l\\s+l\\s+m|l\\s+lm|llm)\\b/gi, "LLM"],
      [/\\b(?:g\\s+p\\s+t|gpt)\\b/gi, "GPT"],
      [/\\b(?:chat\\s*gpt)\\b/gi, "ChatGPT"],
      [/\\b(?:p\\s+d\\s+f|pdf)\\b/gi, "PDF"],
      [/\\b(?:u\\s+r\\s+l|url)\\b/gi, "URL"],
      [/\\b(?:a\\s+p\\s+i|api)\\b/gi, "API"],
      [/\\b(?:you\\s*tube)\\b/gi, "YouTube"],
      [/\\b(?:git\\s*hub)\\b/gi, "GitHub"],
      [/\\b(?:ar\\s*k?ive?|r\\s*kive?|arxiv)\\b/gi, "arXiv"],
      [/\\b(?:wiki\\s*pedia)\\b/gi, "Wikipedia"],
      [/\\b(?:hugging\\s*face)\\b/gi, "Hugging Face"],
      [/\\b(?:u\\s*i)\\b/gi, "UI"],
      [/\\b(?:u\\s*x)\\b/gi, "UX"],
    ];
    for (let r = 0; r < replacements.length; r++) {
      t = t.replace(replacements[r][0], replacements[r][1]);
    }
    t = t.replace(/^(?:open\\s+up|go\\s+to|navigate\\s+to)\\s+([a-zA-Z0-9-]+)(?:\\s+dot\\s+com|\\.com)\\b/i, (m, domain) => "Open " + domain.toLowerCase() + ".com");
    if (t.length > 0) {
      t = t.charAt(0).toUpperCase() + t.slice(1);
    }
    return t;
  }

  function commitVoiceText(resultText) {
    if (!resultText || isPausedForExecution || isSpeaking) return;
    const cleanText = normalizeVoiceText(resultText);
    if (!cleanText || cleanText.length < 2) return;

    if (silenceCommitTimer) {
      clearTimeout(silenceCommitTimer);
      silenceCommitTimer = null;
    }
    accumulatedFinalTranscript = "";
    activeInterimText = "";

    const now = Date.now();
    const cleanLower = cleanText.toLowerCase();
    const lastLower = (lastCommittedText || "").toLowerCase();

    // 1. Semantic deduplication: ignore identical or partial fragment commands within 3.5s window
    if (now - lastCommittedTime < 3500) {
      if (cleanLower === lastLower || cleanLower.includes(lastLower) || lastLower.includes(cleanLower)) {
        console.log("[Kira Voice] Dropped rapid duplicate/fragment voice command within 3.5s:", cleanText);
        return;
      }
    }

    // Fast local browser voice action dispatcher
    if (handleFastVoiceAction(cleanText)) {
      lastCommittedText = cleanText;
      lastCommittedTime = now;
      console.log("[Kira Voice] Executed instant local voice action:", cleanText);
      return;
    }

    lastCommittedText = cleanText;
    lastCommittedTime = now;
    console.log("[Kira Voice] Realtime voice command committed:", cleanText);
    isPausedForExecution = true;
    updateFloatStatus("Thinking...");

    // Pause live speech recognition during active task dispatch to eliminate acoustic self-echo
    if (speechRecognizer) {
      try { speechRecognizer.stop(); } catch {}
    }

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

        // Barge-in 1: Interrupt active task execution if user commands stop/cancel
        if (isPausedForExecution) {
          const heard = (event.results[event.results.length - 1]?.[0]?.transcript || "").trim().toLowerCase();
          if (/\\b(stop|cancel|abort|halt|pause|wait|hold on)\\b/i.test(heard)) {
            console.log("[Kira Voice] Voice abort detected during active execution:", heard);
            isPausedForExecution = false;
            if (executionWatchdogTimer) clearTimeout(executionWatchdogTimer);
            executionWatchdogTimer = null;
            updateFloatStatus("Cancelled");
            if (typeof hideSkeleton === "function") hideSkeleton();
            if (statusLabel) {
              statusLabel.textContent = "Kira Voice: Task cancelled by voice command.";
            }
            speakText("I've stopped that task for you.");
            return;
          }
          return;
        }

        // Barge-in 2: If Kira is speaking, ignore speaker acoustic echo (first 1.5s)
        // and only stop if user speaks a clear, distinct multi-word command
        if (isSpeaking) {
          if (Date.now() - speakingStartTime < 1500) {
            return;
          }
          const heardWords = (event.results[event.results.length - 1]?.[0]?.transcript || "").trim().split(/\\s+/).filter(Boolean);
          if (heardWords.length >= 2) {
            stopSpeaking();
          } else {
            return;
          }
        }

        let interim = "";
        let finalPhrase = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcript = item[0]?.transcript || "";
          if (item.isFinal) {
            finalPhrase += (finalPhrase ? " " : "") + transcript.trim();
          } else {
            interim += (interim ? " " : "") + transcript.trim();
          }
        }

        if (finalPhrase) {
          accumulatedFinalTranscript += (accumulatedFinalTranscript ? " " : "") + finalPhrase;
        }
        activeInterimText = interim;

        const liveDisplay = (accumulatedFinalTranscript + " " + activeInterimText).trim();
        if (liveDisplay) {
          const displayTxt = liveDisplay.length > 25 ? liveDisplay.slice(0, 22) + "..." : liveDisplay;
          updateFloatStatus("Hearing: " + displayTxt);
          if (statusLabel) {
            statusLabel.textContent = "Hearing: " + liveDisplay;
          }
        }

        // Natural conversational pause commit (1400ms)
        // Prevents premature cutting-off of sentences while the user pauses or thinks
        if (silenceCommitTimer) clearTimeout(silenceCommitTimer);
        silenceCommitTimer = setTimeout(() => {
          if (!isPausedForExecution && !isSpeaking) {
            const candidate = (accumulatedFinalTranscript || activeInterimText).trim();
            accumulatedFinalTranscript = "";
            activeInterimText = "";
            if (candidate && candidate.length >= 2) {
              commitVoiceText(candidate);
            }
          }
        }, 1400);
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
        // If there is an accumulated completed utterance waiting when recognition pauses, finalize it cleanly
        if (accumulatedFinalTranscript && !isPausedForExecution && !isSpeaking) {
          if (silenceCommitTimer) clearTimeout(silenceCommitTimer);
          silenceCommitTimer = null;
          const candidate = accumulatedFinalTranscript.trim();
          accumulatedFinalTranscript = "";
          activeInterimText = "";
          commitVoiceText(candidate);
        }

        // Keep continuously listening if voice mode is still active
        if (isVoiceModeActive && !isSpeaking && !isPausedForExecution) {
          if (recognitionRestartTimer) clearTimeout(recognitionRestartTimer);
          recognitionRestartTimer = setTimeout(() => {
            if (isVoiceModeActive && !isSpeaking && !isPausedForExecution && speechRecognizer) {
              try {
                speechRecognizer.start();
              } catch {}
            }
          }, 250);
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
  async function formulateSpokenText(rawText, userCommand = "") {
    if (!rawText) return "";
    const trimmed = rawText.trim();

    // If text is already very short, natural and plain (no markdown, headers, code, urls)
    if (trimmed.length < 80 && !trimmed.includes("#") && !trimmed.includes(String.fromCharCode(96, 96, 96)) && !trimmed.includes("http") && !trimmed.includes("[")) {
      return trimmed.replace(new RegExp("[*_#" + String.fromCharCode(96) + "\\\"]", "g"), "").trim();
    }

    // Attempt Kira Companion Voice formulation via backend exposed function
    try {
      if (typeof window.kira_generate_voice_response === "function") {
        const companionSpeech = await window.kira_generate_voice_response({
          userCommand: userCommand || lastSubmittedCommand || "",
          agentOutcome: trimmed,
          taskStatus: "COMPLETED",
        });
        if (companionSpeech && companionSpeech.trim().length > 3) {
          return companionSpeech.trim();
        }
      }
    } catch (e) {
      console.debug("[Kira Voice] Companion formulation notice:", e);
    }

    // Fast client-side linguistic distillation fallback
    let cleanText = trimmed
      .split(String.fromCharCode(96, 96, 96)).filter((_, idx) => idx % 2 === 0).join(" ")
      .replace(/\\[([^\\]]+)\\]\\([^)]+\\)/g, "$1")
      .replace(/[*_#~]/g, "")
      .replace(new RegExp(String.fromCharCode(96), "g"), "")
      .replace(/https?:\\/\\/\\S+/g, "")
      .replace(/^[\\s•\\-\\*\\d\\.\\)\\:]+/gm, "")
      .replace(/\\n+/g, " ")
      .trim();

    const sentences = cleanText.split(/(?<=[.?!])\s+/);
    if (sentences.length > 2) {
      cleanText = sentences.slice(0, 2).join(" ");
    }
    if (cleanText.length > 180) {
      cleanText = cleanText.slice(0, 175).trim() + "...";
    }
    return cleanText || "I've completed your task. Check the chat for details.";
  }

  async function speakText(text, triggerBtn = null, onSpokenCallback = null) {
    if (!text || typeof text !== "string") return;

    // Toggle stop if clicking the same speaking button
    if (activeSpeakingBtn === triggerBtn && triggerBtn && isSpeaking) {
      stopSpeaking();
      return;
    }

    stopSpeaking();
    isSpeaking = true;

    // Completely abort and silence microphone during speech output to prevent acoustic feedback
    if (speechRecognizer) {
      try {
        speechRecognizer.abort();
      } catch {}
      speechRecognizer = null;
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
        const cleanText = await formulateSpokenText(text, lastSubmittedCommand);

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
    }, 15000);

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
        engine: voiceSettings.ttsEngine || "browser",
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
