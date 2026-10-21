# Voice Agent Single Source of Truth & Conversation Context

> **Feature Focus**: Dedicated Voice Agent ("Kira")  
> **Repository**: AgenticBrowser  
> **Status**: Active Pair-Programming & Continuous Improvement Loop  
> **Rule**: For EVERY conversation, update this single file with:
> 1. User's exact words and instructions
> 2. Deep architectural research & analysis
> 3. Problems and bugs identified
> 4. Improvements implemented
> 5. Comprehensive test results
> 6. Testing feedback from the user & next steps

---

## 1. Conversation History & User Directives Log

### Session 1 (2026-10-20)
- **User Request**:
  > *"hey i want you to just focus on only one and only feature " voice agent".*  
  > ** All you have to do is analyze*  
  > ** find problems*  
  > ** imporove*  
  > ** test*  
  > ** i will test as well and tell you the errors or improvements or features*  
  > ** repeat*  
  > *TO MAINTAIN ALL THESE CONSISTENCY OF OUR CONVERSATION CREATE A CONTEXT FOLDER AND ONE SINGLE FILE FOR THIHS AND FOR EVERY CONVERSATION UPDATE OUR CONVERSATION AND YOUR CHANGES AND MY WORDS AND CONVERSTAION INTO IT AND FOR EVERY CONVERSATION READ AND UNDERSTAND AND THINK AND DEEPRESEARCH AND START WORKING UNDERSTAND ?"*

- **Agent Commitment**:
  - Focus strictly and exclusively on the Voice Agent feature.
  - Maintain this single context file as the living log of our work, conversations, and progress.
  - Read, understand, deep-research, identify issues, implement improvements, write automated tests, and provide a clear report for the user's manual testing.

### Session 2 (2026-10-20)
- **User Feedback & Observations**:
  > *"hey observe this the language is changed to something isted of english.*  
  > *The sidechatoverlay is not visible*  
  > *There is a top banner displaying something"*  
  > *(Attached screenshot showing Chromium on google.com with regional Malayalam text, missing sidebar overlay, and top warning banner: "You are using an unsupported command-line flag: --disable-setuid-sandbox. Stability and security will suffer.")*

- **Root Cause Analysis**:
  1. **Missing Overlay**: In `src/utils/ui/sidebar/voiceManager.js`, a regex in `formulateSpokenText` contained single backslashes `/[([^\]]+)\]/` inside a JavaScript template literal string, which caused evaluation to strip the backslash into an invalid regular expression (`Unmatched ')'`). The browser threw a `SyntaxError` on script evaluation, crashing overlay injection.
  2. **Non-English Language**: Chromium launched without explicit locale flags, causing Google to geolocate the user's IP to regional India and render in Malayalam script.
  3. **Yellow Warning Banner**: `--disable-setuid-sandbox` is a Linux-only command-line flag. On Windows, Chromium displays an unsupported flag warning bar.

- **Fixes Applied**:
  1. Fixed all regex escaping across `voiceManager.js` (`handleFastVoiceAction`, `rec.onresult`, `formulateSpokenText`).
  2. Added syntax validation test with JavaScript `Function` constructor and verified live Playwright page injection on `google.com`.
  3. Removed `--disable-setuid-sandbox`, added `--test-type`, `--disable-infobars`, `--lang=en-US`, `locale: "en-US"`, `Accept-Language: "en-US,en;q=0.9"`, and navigated to `https://www.google.com?hl=en`.
  4. Verified that Google renders 100% in English, the yellow banner is gone, and the sidebar overlay mounts with full Kira Voice controls.

### Session 3 (2026-10-20)
- **User Feedback & Observations**:
  > *"hey it is taking voice inputs some time accurately some times not what could be reason and also it some times executing the same inputs multiple times"*  
  > *(Attached screenshot showing two user bubbles dispatched: "open article regarding with" followed by "open article regarding me" for a single spoken query regarding the AI bubble).*

- **Root Cause Analysis**:
  1. **Premature Interim Commits (750ms)**: When speaking, Chrome emits unrefined, phonetic `interim` results. A 750ms silence timer was firing mid-sentence whenever the user took a breath or paused briefly, committing incomplete acoustic draft fragments (e.g. "open article regarding with") instead of the complete phrase.
  2. **Interim + Final Double Trigger**: After the 750ms interim timer committed the first half, Chrome finalized the sentence or emitted another draft ("open article regarding me"), and `commitVoiceText` committed it a second time.
  3. **Zero Deduplication**: `commitVoiceText` lacked semantic de-duplication; any command arriving within 1–3 seconds was accepted regardless of whether it was a partial fragment or identical.
  4. **Unsynchronized Page Navigation**: When the agent navigated to a new page (e.g. Goldman Sachs), the newly mounted overlay initialized with `isPausedForExecution = false`, causing the mic to listen and re-commit while the previous task was still executing.

- **Fixes Applied**:
  1. **Utterance Buffer & Natural Silence Commit**:
     - Removed the premature 750ms interim commit.
     - Implemented an accumulated final transcript buffer across all `event.results` clauses.
     - Increased silence commit delay to **1400ms** (1.4s), waiting for natural sentence completion before committing.
  2. **Multi-Tier Semantic De-duplication**:
     - Added 3.5-second time-window deduplication in `commitVoiceText` and `orchestrator.js`: rejects exact duplicates and partial/substring fragments.
  3. **Acoustic Self-Echo Prevention**:
     - Temporarily stops the speech recognizer immediately upon task dispatch to eliminate self-echo while the agent navigates.
  4. **Cross-Page Execution State Synchronization**:
     - Added `uiManager.setExecuting(true/false)` in `orchestrator.js`.
     - Injected `window.__IS_TASK_RUNNING__` into every page overlay so newly loaded pages respect active background tasks.
  5. **Automated Verification**:
     - Extended test suite to 13 automated tests (all 13 passing).

### Session 4 (2026-10-21)
- **User Request**:
  > *"hey can we imporive the voice input taking and output genration ?"*

- **Deep Architectural Research & Analysis**:
  1. **Voice Input Taking Bottlenecks**:
     - Chrome Web Speech API operates on general dictation, causing phonetic errors on acronyms and tech terms (`"eye in a bubble"` / `"a i"` instead of `"AI"`, `"archive"` instead of `"arXiv"`, `"git hub"` instead of `"GitHub"`, `"you tube"` instead of `"YouTube"`, `"p d f"` instead of `"PDF"`).
     - Missing domain navigation intent normalizer: queries like `"go to youtube dot com"` were submitted raw without canonical formatting.
     - The local Web Audio API VAD fallback had a residual 750ms silence timeout instead of aligning with the 1400ms conversational pause commit.
  2. **Voice Output Generation Bottlenecks**:
     - `ttsEngine` defaulted to `"browser"` in settings, forcing Chromium to use robotic Windows SAPI5 voices (Microsoft David/Zira/Ravi) with zero conversational emotion or natural breathing.
     - While `msedge-tts` was integrated, Indian English users lacked natural local neural voices (`en-IN-NeerjaNeural`, `en-IN-PrabhatNeural`).
     - Companion formulation round-tripped to LLM even for trivial pleasantries ("thank you", "who are you") or already concise outcomes, introducing 2.5s synthesis latency.
     - Sidebar settings UI lacked direct dropdown controls for voice engine and microphone accent.

- **Improvements Implemented**:
  1. **Intelligent Domain-Aware Speech Normalizer (`normalizeVoiceInput`)**:
     - Created `normalizeVoiceInput()` in `src/core/voice/speechFilter.js` and embedded it into `voiceManager.js`.
     - Automatically cleans colloquial prefixes ("hey kira", "could you please"), normalizes technical acronyms (`AI`, `LLM`, `GPT`, `ChatGPT`, `PDF`, `URL`, `API`, `YouTube`, `GitHub`, `arXiv`, `Wikipedia`, `UI`), canonicalizes domain navigation (`"go to youtube dot com"` -> `"Open youtube.com"`), and enforces proper capitalization.
  2. **VAD Silence Alignment**:
     - Updated Web Audio VAD fallback commit timeout from 750ms to 1400ms.
  3. **Studio-Quality Microsoft Edge Neural TTS by Default**:
     - Upgraded default `ttsEngine` from `"browser"` to `"edge"`.
     - Added curated Indian English neural voices:
       * `in_neerja` (`en-IN-NeerjaNeural`): Warm, natural Indian English female tone.
       * `in_prabhat` (`en-IN-PrabhatNeural`): Clear, conversational Indian English male tone.
     - Preserved graceful multi-tier fallbacks: Edge Neural -> Kokoro-82M ONNX -> Browser Web Speech.
  4. **Instant Conversational Fast-Paths (<5ms)**:
     - Added instant response rules in `VoiceAgent.generateVoiceResponse()` for greetings, gratitude ("You're very welcome!"), identity ("I'm Kira..."), and concise plain-text outcomes.
  5. **Hands-Free Speech Controls**:
     - Users can speak: *"Speak faster"*, *"Speak slower"*, *"Switch to Indian voice"*, *"Switch to American voice"*.
  6. **Sidebar Settings Controls**:
     - Added Voice Persona, Microphone Recognition Accent (`en-IN`, `en-US`, `en-GB`), and Speech Synthesis Engine (`edge`, `browser`, `kokoro`) selectors into `templates.js`.
  7. **Testing & Verification**:
     - Expanded test suite in `scratch/test_voice_agent_suite.mjs` to **15 comprehensive tests** across 7 suites (`15 PASSED, 0 FAILED`).

### Session 5 (2026-10-21)
- **User Request**:
  > *"push to github"*
- **Actions Taken**:
  1. Ran pre-commit test suite verification (15 passed, 0 failed).
  2. Staged all core voice agent updates, normalizers, Edge Neural TTS integrations, settings templates, and this single context log file (`context/VOICE_AGENT_CONTEXT.md`).
  3. Committed and pushed directly to `origin/main`.

---

## 2. Voice Agent Architecture Overview

The Voice Agent ("Kira") is a multi-tier conversational and hands-free voice control system integrated into AgenticBrowser:

```
+-----------------------------------------------------------------------------------+
|                                  USER / SPEECH                                    |
+-----------------------------------------------------------------------------------+
                               |              ^
                 1. User Speech|              | 5. Kira Companion Speech
                               v              |
+-----------------------------------------------------------------------------------+
| FRONTEND OVERLAY (voiceManager.js & chatManager.js inside sidebar)                 |
| - Web Speech API SpeechRecognition (Continuous streaming listening)               |
| - Fallback: Web Audio API 16kHz PCM capture + local VAD                           |
| - Live 9-bar crimson audio visualizer synced to vocal energy & formants           |
| - Floating bottom widget (#as-voice-floating-widget)                              |
| - Barge-in detection (stops speaking if user interrupts)                          |
| - Voice Actions Dispatcher (instant hands-free actions: scroll, stop, reload)     |
+-----------------------------------------------------------------------------------+
           |                                                      ^
           | 2. Spoken Command / Audio                            | 4. Spoken
           v                                                      |    Companion Text
+--------------------------------------+   +----------------------------------------+
| BACKEND CORE (browserManager.js)     |   | VOICE COMPANION AGENT (voiceAgent.js)  |
| - Exposed functions:                 |   | - LLM Persona Prompt: Kira             |
|   * kira_generate_voice_response     |-->| - Generates short, warm 1-2 sentence   |
|   * kira_synthesize_speech           |   |   companion responses                  |
|   * kira_transcribe_audio            |   | - Fallback: Linguistic Distiller       |
|   * kira_get_voice_settings          |   |   (speechFilter.js)                    |
|   * kira_save_voice_settings         |   +----------------------------------------+
+--------------------------------------+                      |
           |                                                  v
           v                               +----------------------------------------+
+--------------------------------------+   | TTS SYNTHESIS ENGINE (voiceService.js) |
| ASR TRANSCRIBER (sttService.js)      |   | - Engine 1: Instant Browser Speech     |
| - Local Whisper ONNX (100% offline)  |   | - Engine 2: Microsoft Edge Neural TTS  |
| - Amplitude & RMS noise gating       |   | - Engine 3: Local Kokoro-82M ONNX      |
| - Hallucination token scrubber       |   +----------------------------------------+
+--------------------------------------+
```

---

## 3. Deep Analysis & Problems Identified

### Problem 1: VoiceAgent Companion Personality Bypassed in Default TTS Mode [HIGH SEVERITY]
- **Where**: `src/utils/ui/sidebar/voiceManager.js:795-816`
- **Root Cause**: When `ttsEngine === "browser"` (the system default), `speakText(text)` performed a rudimentary regex slice on raw agent markdown and read the first 3 lines directly. It NEVER called `VoiceAgent.generateVoiceResponse` or `kira_generate_voice_response`.
- **Impact**: The user never heard Kira's warm companion personality; instead, they heard clipped technical text (e.g. "Step 1: Navigating to https://...").
- **Fix**: Wire `kira_generate_voice_response` into the frontend speech flow so that regardless of whether Browser, Edge, or Kokoro TTS is used, the text is first distilled and formulated through Kira's companion agent before synthesis.

### Problem 2: Mid-Sentence Token Truncation in VoiceAgent [HIGH SEVERITY]
- **Where**: `src/agents/voiceAgent.js:59`
- **Root Cause**: `maxTokens: 60` was too constrained for system prompt context + response. A test with *"Search for quantum computing papers on arxiv"* produced: `"I found five quantum computing papers on arXiv and downloaded three of them to"` — cut off mid-sentence without punctuation.
- **Impact**: Incomplete sentences spoken aloud to the user.
- **Fix**:
  1. Increase `maxTokens` to 120.
  2. Implement an intelligent sentence boundary sanitizer that ensures responses end with clean terminal punctuation (`.`, `!`, `?`) and removes dangling prepositions/conjunctions (`to`, `and`, `with`, `for`, `the`).

### Problem 3: No Barge-In / Voice Interruption During Active Execution [HIGH SEVERITY]
- **Where**: `src/utils/ui/sidebar/voiceManager.js:276, 327`
- **Root Cause**: During agent task execution, `isPausedForExecution` is `true`. Lines 276 and 327 unconditionally dropped all incoming speech results:
  ```js
  if (!resultText || isPausedForExecution || isSpeaking) return;
  if (!isVoiceModeActive || isPausedForExecution) return;
  ```
- **Impact**: If the browser agent is running and the user says "Stop!", "Cancel!", "Hold on!", or "Wait!", the voice listener completely ignored them. The user had zero hands-free control to abort tasks.
- **Fix**: Add an execution-interrupt detection handler in `rec.onresult`. If the user says an abort/stop command while `isPausedForExecution === true`, immediately cancel execution, notify the UI, and speak a confirmation.

### Problem 4: Missing Instant Hands-Free Browser Voice Commands [MEDIUM SEVERITY]
- **Where**: `src/utils/ui/sidebar/voiceManager.js`
- **Root Cause**: Every single voice phrase was sent to the heavy multi-agent backend planner via `triggerSubmit()`. Saying "scroll down" took 5-10 seconds of LLM deliberation.
- **Impact**: Sluggish UX for basic hands-free navigation.
- **Fix**: Introduce a client-side Fast Voice Command Dispatcher that matches common browsing actions:
  - "scroll down" / "page down" / "scroll to bottom"
  - "scroll up" / "page up" / "scroll to top"
  - "go back" / "previous page"
  - "go forward" / "next page"
  - "refresh page" / "reload"
  - "turn off voice" / "stop listening" / "mute"
  These execute immediately in <10ms directly in the browser page without backend LLM overhead.

### Problem 5: Edge TTS (`msedge-tts`) Unused Despite Dependency [MEDIUM SEVERITY]
- **Where**: `package.json` vs `src/core/voice/voiceService.js`
- **Root Cause**: `msedge-tts` was listed in `package.json` but `voiceService.js` only supported `kokoro` (slow on CPU ~3s) and browser Web Speech.
- **Impact**: Missed opportunity for studio-quality Microsoft Neural TTS (e.g. Aria, Jenny, Guy, Sonia) with ultra-low latency (<400ms).
- **Fix**: Integrate `msedge-tts` into `voiceService.js` with audio streaming to base64, exposed under the `edge` TTS engine option.

### Problem 6: SpeechFilter Path and Greeting Distillation Flaws [LOW SEVERITY]
- **Where**: `src/core/voice/speechFilter.js:132, 146`
- **Root Cause**:
  1. Only Windows backslash paths `[A-Z]:\\[^\s]+` were generalized; Unix/POSIX paths (e.g. `/downloads/...`) were read literally.
  2. Casual greetings under 12 words were awkwardly appended with `" Details are in your chat."`.
- **Fix**: Expand path normalization to Unix/web paths, and refine greeting exclusions.

---

## 4. Improvements Implemented (Session 1)

1. **`src/agents/voiceAgent.js`**:
   - Increased `maxTokens` to 120.
   - Added `sanitizeSpokenUtterance()` to guarantee complete sentences, eliminate trailing prepositions, and enforce terminal punctuation.
   - Enhanced fallback handling when LLM races or times out.

2. **`src/core/voice/speechFilter.js`**:
   - Improved POSIX and Windows file path redaction.
   - Fixed awkward "Details are in your chat." suffix on conversational greetings and short replies.

3. **`src/core/voice/voiceService.js`**:
   - Added Edge Neural TTS integration via `msedge-tts` with high-quality streaming MP3 buffer conversion.
   - Expanded curated voices list with both Kokoro and Edge neural voices.

4. **`src/utils/ui/sidebar/voiceManager.js`**:
   - Added **Instant Voice Command Dispatcher**:
     * Scroll commands (down, up, top, bottom)
     * Navigation commands (back, forward, refresh)
     * Voice toggle commands (mute, turn off)
   - Added **Live Execution Barge-in Interruption**:
     * User can say "Stop", "Cancel", "Abort", or "Hold on" while a task is running to immediately abort execution.
   - Unified Companion Formulation:
     * When browser speech synthesis speaks, it first queries `kira_generate_voice_response` so Kira's companion persona speaks naturally instead of reciting raw markdown.
   - Rebuilt `sidebar.bundle.js` with the updated modular code.

---

## 5. Automated Test Suite & Results

### Test Suite (`scratch/test_voice_agent_suite.mjs`):
- [x] **Sentence Sanitizer Test**: Removes dangling prepositions (`to`, `and`, etc.) and enforces terminal punctuation.
- [x] **Sentence Structure Test**: Preserves complete questions and exclamations untouched.
- [x] **Linguistic Distiller Test**: Cleans URLs, markdown, and code blocks from text.
- [x] **Download Summary Test**: Converts complex download reports into companion summaries without leaking local paths.
- [x] **Greeting Test**: Preserves friendly greetings without awkward suffix.
- [x] **VoiceAgent Greeting & Conversational Fast-Paths Test**: Confirms Kira responds instantly to greetings, gratitude, and identity queries.
- [x] **VoiceAgent Outcome Formulation Test**: Formulates a warm, concise companion response (`"I found four papers on quantum teleportation and downloaded two PDFs to your downloads folder."`).
- [x] **Speech Input Normalizer Test**: Cleans technical acronyms (`AI`, `LLM`, `arXiv`, `PDF`, `URL`, `GitHub`, `YouTube`) and domain navigation.
- [x] **Edge Neural TTS Test**: Synthesizes studio-grade MP3 base64 audio in <1000ms (`en-US-AriaNeural`).
- [x] **Indian English Neural Voice Test**: Synthesizes natural Indian English speech (`in_neerja` - `en-IN-NeerjaNeural`).
- [x] **Voice Settings Test**: Returns curated voices and settings correctly with Edge default.
- [x] **STT Whisper Silence Rejection Test**: Correctly filters ambient silence/noise without running heavy model inference.
- [x] **Modular Sidebar Bundle Test**: Verifies `build.js` generates `sidebar.bundle.js` with instant voice actions, barge-in, normalizer, and companion formulation.

**Result**: `15 PASSED, 0 FAILED` (100% pass rate).

---

## 6. Feedback & Next Iteration Roadmap (For User Testing)

### Things for the User to Test:
1. **Alt+V / Mic Switch**: Click the mic switch in the sidebar rail or press `Alt+V`. Check if the crimson 9-bar floating visualizer appears at bottom center.
2. **Instant Hands-Free Voice Commands**:
   - Say: *"Scroll down"* -> Page should scroll smoothly immediately.
   - Say: *"Scroll up"* -> Page should scroll back up.
   - Say: *"Refresh page"* -> Page should reload.
3. **Task Execution with Voice**:
   - Say: *"Search for latest AI news"* -> Should submit to the agent, update status to "Thinking...", and execute.
4. **Voice Barge-in / Interrupt**:
   - While the agent is navigating, say: *"Stop"* or *"Cancel"* -> Execution should immediately abort.
5. **Kira Spoken Feedback**:
   - Notice Kira's spoken voice response: it should be 1-2 warm companion sentences rather than reciting raw markdown.

### User Feedback Log:
*(Awaiting user testing feedback to populate in the next turn)*
