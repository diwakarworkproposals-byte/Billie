import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, X, Volume2 } from 'lucide-react';
import { useSpeechRecognition } from '../utils/speechRecognition';

export default function BottomSearchBar({ onQuerySubmit, activePromptHint = '' }) {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef(null);

  const {
    isListening,
    transcript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  // Synchronize speech transcript to input field
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  // When speech recognition ends and there's captured text, auto-submit or focus
  useEffect(() => {
    if (!isListening && transcript.trim().length > 0) {
      const captured = transcript.trim();
      resetTranscript();
      // Auto-submit after voice finish for a hands-free conversational flow
      onQuerySubmit(captured);
      setInputText('');
    }
  }, [isListening, transcript, onQuerySubmit, resetTranscript]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isListening) {
      stopListening();
      return;
    }
    const query = inputText.trim();
    if (!query) return;

    onQuerySubmit(query);
    setInputText('');
    resetTranscript();
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      setInputText('');
      startListening();
    }
  };

  const handleClear = () => {
    setInputText('');
    resetTranscript();
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="bottom-search-wrapper">
      {/* Speech Listening Pulse Banner */}
      {isListening && (
        <div className="speech-listening-banner animate-fade-in">
          <div className="pulse-indicator">
            <span className="pulse-ring" />
            <span className="pulse-dot" />
          </div>
          <span className="listening-text">
            {transcript ? `"${transcript}"` : 'Listening... Say "Generate invoice" or customer details'}
          </span>
          <button
            type="button"
            onClick={stopListening}
            className="stop-speech-chip"
          >
            Done
          </button>
        </div>
      )}

      {/* Speech Error Banner if permission or unsupported */}
      {speechError && (
        <div className="speech-error-banner animate-fade-in">
          <span>{speechError}</span>
          <button type="button" onClick={() => {}} className="dismiss-btn">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Floating Center Search Bar */}
      <form onSubmit={handleSubmit} className={`bottom-search-bar ${isListening ? 'listening-active' : ''}`}>
        <div className="search-leading-icon">
          <Sparkles className="sparkle-icon" size={19} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            activePromptHint ||
            (isListening
              ? 'Listening to your voice...'
              : "Ask Billie or type 'generate invoice'...")
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
          className={`mic-button ${isListening ? 'active' : ''}`}
          title={isListening ? 'Stop listening' : 'Start speaking (Voice command)'}
          aria-label="Microphone"
        >
          {isListening ? (
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
