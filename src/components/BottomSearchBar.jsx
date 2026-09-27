import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, X, Volume2, Globe } from 'lucide-react';
import { useSpeechRecognition, stopSpeaking } from '../utils/speechRecognition';
import { useApp } from '../context/AppContext';

export default function BottomSearchBar({ onQuerySubmit, activePromptHint = '' }) {
  const {
    settings,
    setLanguage,
    isVoiceSessionActive,
    setIsVoiceSessionActive
  } = useApp();

  const [inputText, setInputText] = useState('');
  const inputRef = useRef(null);

  const isHindi = settings.language === 'hi';
  const langCode = isHindi ? 'hi-IN' : 'en-US';

  const {
    isListening,
    transcript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition(langCode);

  // Synchronize speech transcript to input field
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  // When speech recognition ends
  useEffect(() => {
    if (!isListening) {
      // CASE A: User spoke something -> auto-submit!
      if (transcript.trim().length > 0) {
        const captured = transcript.trim();
        resetTranscript();
        onQuerySubmit(captured);
        setInputText('');
      } else if (isVoiceSessionActive) {
        // CASE B: User paused / silence occurred while voice session is active
        // Keep mic open unless Billie is currently speaking
        const restartTimer = setTimeout(() => {
          if (
            isVoiceSessionActive &&
            typeof window !== 'undefined' &&
            !window.__BILLIE_TTS_SPEAKING
          ) {
            startListening();
          }
        }, 200);
        return () => clearTimeout(restartTimer);
      }
    }
  }, [isListening, transcript, isVoiceSessionActive, onQuerySubmit, resetTranscript, startListening]);

  // Listen for Billie to finish speaking -> automatically re-open microphone!
  useEffect(() => {
    const handleBillieSpeechEnd = () => {
      if (isVoiceSessionActive) {
        setTimeout(() => {
          startListening();
        }, 200);
      }
    };

    window.addEventListener('billie-tts-end', handleBillieSpeechEnd);
    return () => {
      window.removeEventListener('billie-tts-end', handleBillieSpeechEnd);
    };
  }, [isVoiceSessionActive, startListening]);

  // Continuous listening watchdog: ensures microphone is immediately reactivated whenever it stops,
  // unless Billie is speaking TTS or user manually paused.
  useEffect(() => {
    if (!isVoiceSessionActive) return;

    const watchdog = setInterval(() => {
      if (
        isVoiceSessionActive &&
        !isListening &&
        typeof window !== 'undefined' &&
        !window.__BILLIE_TTS_SPEAKING
      ) {
        startListening();
      }
    }, 400);

    return () => clearInterval(watchdog);
  }, [isVoiceSessionActive, isListening, startListening]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isListening) {
      stopListening();
    }
    const query = inputText.trim();
    if (!query) return;

    onQuerySubmit(query);
    setInputText('');
    resetTranscript();
  };

  const handleMicToggle = () => {
    if (isVoiceSessionActive || isListening) {
      // Turn off hands-free voice session
      setIsVoiceSessionActive(false);
      stopListening();
      stopSpeaking();
    } else {
      // Start hands-free voice session
      setIsVoiceSessionActive(true);
      setInputText('');
      resetTranscript();
      startListening();
    }
  };

  const handleClear = () => {
    setInputText('');
    resetTranscript();
    if (inputRef.current) inputRef.current.focus();
  };

  const toggleLanguage = () => {
    const nextLang = isHindi ? 'en' : 'hi';
    setLanguage(nextLang);
  };

  const defaultPlaceholder = isHindi
    ? "Billie se bolein ya type karein 'bill banao'..."
    : "Ask Billie or type 'generate invoice' / 'bill banao'...";

  return (
    <div className="bottom-search-wrapper">
      {/* Speech Listening Pulse Banner (Hands-Free Active) */}
      {(isListening || isVoiceSessionActive) && (
        <div className="speech-listening-banner animate-fade-in">
          <div className="pulse-indicator">
            <span className="pulse-ring" />
            <span className="pulse-dot" />
          </div>
          <span className="listening-text">
            {transcript
              ? `"${transcript}"`
              : (isHindi
                  ? '🎙️ हैंड्स-फ्री मोड चालू है: बोलिए (माइक पर क्लिक करके रोक सकते हैं)'
                  : '🎙️ Hands-free mode active: Speak your answer...')}
          </span>
          <button
            type="button"
            onClick={handleMicToggle}
            className="stop-speech-chip"
            title="Stop hands-free voice mode"
          >
            {isHindi ? 'रोकें' : 'Stop'}
          </button>
        </div>
      )}

      {/* Speech Error Banner if permission or unsupported */}
      {speechError && (
        <div className="speech-error-banner animate-fade-in">
          <span>{speechError}</span>
          <button
            type="button"
            onClick={() => setIsVoiceSessionActive(false)}
            className="dismiss-btn"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Floating Center Search Bar */}
      <form
        onSubmit={handleSubmit}
        className={`bottom-search-bar ${isListening || isVoiceSessionActive ? 'listening-active' : ''}`}
      >
        <div className="search-leading-icon">
          <Sparkles className="sparkle-icon" size={19} />
        </div>

        {/* Quick Language Toggle Pill */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="lang-quick-toggle m3-ripple"
          title={`Switch Voice Language (Current: ${isHindi ? 'Hindi' : 'English'})`}
        >
          <span>{isHindi ? '🇮🇳 HI' : '🇬🇧 EN'}</span>
        </button>

        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            activePromptHint ||
            (isVoiceSessionActive
              ? (isHindi ? 'लगातार सुन रहे हैं... अपना जवाब बोलें' : 'Listening hands-free... speak your reply')
              : defaultPlaceholder)
          }
          className="search-input"
          aria-label="Billie search and voice prompt"
        />

        {inputText && !isListening && (
          <button
            type="button"
            onClick={handleClear}
            className="search-clear-btn"
            title="Clear text"
          >
            <X size={16} />
          </button>
        )}

        {/* Microphone Voice Button */}
        <button
          type="button"
          onClick={handleMicToggle}
          className={`mic-button ${isListening || isVoiceSessionActive ? 'active' : ''}`}
          title={
            isVoiceSessionActive
              ? 'Stop hands-free voice'
              : `Start speaking (${isHindi ? 'Hindi Voice' : 'English Voice'})`
          }
          aria-label="Microphone"
        >
          {isListening || isVoiceSessionActive ? (
            <div className="mic-listening-waves">
              <span className="wave-bar w1" />
              <span className="wave-bar w2" />
              <span className="wave-bar w3" />
            </div>
          ) : (
            <Mic size={19} />
          )}
        </button>

        {/* Send / Execute Button */}
        <button
          type="submit"
          disabled={!inputText.trim() && !isListening}
          className="send-button m3-ripple"
          title="Send"
          aria-label="Submit"
        >
          <Send size={17} />
        </button>
      </form>
    </div>
  );
}
