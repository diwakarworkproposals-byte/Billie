import { useState, useEffect, useRef, useCallback } from 'react';

// Keep module-level reference to prevent garbage collection of SpeechSynthesisUtterance in Chrome/Android
let activeUtterance = null;
let ttsSafetyTimeoutId = null;

export function useSpeechRecognition(langCode = 'hi-IN') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = langCode;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.warn('[Billie Voice] Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone permission was denied. Please allow microphone access in browser settings.');
          setIsListening(false);
        } else if (event.error === 'no-speech' || event.error === 'aborted') {
          // Normal silence pause or transition abort — do NOT set user-facing error so session can continue
          setIsListening(false);
        } else {
          setError(`Voice input error: ${event.error}`);
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [langCode]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    // If Billie TTS is currently speaking, wait until speech finishes
    if (typeof window !== 'undefined' && window.__BILLIE_TTS_SPEAKING) {
      return;
    }
    if (recognitionRef.current) {
      try {
        setTranscript('');
        setError(null);
        recognitionRef.current.lang = langCode;
        recognitionRef.current.start();
      } catch (err) {
        // Recognition might be in transition or already started; abort and retry cleanly
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        setTimeout(() => {
          try {
            if (
              recognitionRef.current &&
              typeof window !== 'undefined' &&
              !window.__BILLIE_TTS_SPEAKING
            ) {
              recognitionRef.current.lang = langCode;
              recognitionRef.current.start();
            }
          } catch (e) {
            console.warn('Speech recognition retry start attempt:', e);
          }
        }, 120);
      }
    }
  }, [isSupported, langCode]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript
  };
}

// Text-to-speech helper with Hindi & English voice selection and GC protection
export function speakText(text, lang = 'hi', onEnd = null) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      if (ttsSafetyTimeoutId) {
        clearTimeout(ttsSafetyTimeoutId);
        ttsSafetyTimeoutId = null;
      }
      window.speechSynthesis.cancel();
      window.__BILLIE_TTS_SPEAKING = true;
      window.dispatchEvent(new CustomEvent('billie-tts-start'));

      const utterance = new SpeechSynthesisUtterance(text);
      activeUtterance = utterance; // Prevent garbage collection in Chrome/Android
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const targetLang = lang === 'hi' ? 'hi-IN' : 'en-US';
      utterance.lang = targetLang;

      // Pick matching Hindi or English voice
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const match = voices.find(
          (v) => v.lang === targetLang || v.lang.startsWith(targetLang.split('-')[0])
        );
        if (match) {
          utterance.voice = match;
        }
      }

      const finishSpeech = () => {
        if (ttsSafetyTimeoutId) {
          clearTimeout(ttsSafetyTimeoutId);
          ttsSafetyTimeoutId = null;
        }
        window.__BILLIE_TTS_SPEAKING = false;
        activeUtterance = null;
        window.dispatchEvent(new CustomEvent('billie-tts-end'));
        if (onEnd) onEnd();
      };

      utterance.onend = finishSpeech;
      utterance.onerror = (e) => {
        console.warn('Speech synthesis utterance error:', e);
        finishSpeech();
      };

      // Watchdog timeout to prevent speech from getting stuck if browser fails to trigger onend
      const safetyMs = Math.max(3000, text.length * 85 + 1500);
      ttsSafetyTimeoutId = setTimeout(() => {
        if (window.__BILLIE_TTS_SPEAKING) {
          console.warn('[Billie Voice] Speech watchdog safety timeout fired');
          finishSpeech();
        }
      }, safetyMs);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis failed:', err);
      if (ttsSafetyTimeoutId) clearTimeout(ttsSafetyTimeoutId);
      window.__BILLIE_TTS_SPEAKING = false;
      activeUtterance = null;
      window.dispatchEvent(new CustomEvent('billie-tts-end'));
      if (onEnd) onEnd();
    }
  } else if (onEnd) {
    onEnd();
  }
}

export function stopSpeaking() {
  if (ttsSafetyTimeoutId) {
    clearTimeout(ttsSafetyTimeoutId);
    ttsSafetyTimeoutId = null;
  }
  activeUtterance = null;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    window.__BILLIE_TTS_SPEAKING = false;
  }
}
