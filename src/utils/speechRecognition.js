import { useState, useEffect, useRef, useCallback } from 'react';

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
          setError('Microphone permission was denied. Please allow microphone access.');
        } else if (event.error === 'no-speech') {
          // No speech detected
        } else {
          setError(`Voice input error: ${event.error}`);
        }
        setIsListening(false);
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
        recognitionRef.current.abort();
      }
    };
  }, [langCode]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    if (recognitionRef.current) {
      try {
        setTranscript('');
        setError(null);
        recognitionRef.current.lang = langCode;
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Speech recognition restart caught:', err);
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            recognitionRef.current.lang = langCode;
            recognitionRef.current.start();
          } catch (e) {
            setError('Could not start microphone. Please try again.');
          }
        }, 150);
      }
    }
  }, [isSupported, langCode]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

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

// Text-to-speech helper with Hindi & English voice selection
export function speakText(text, lang = 'hi') {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // slightly slower for clearer diction
    utterance.pitch = 1.0;

    const targetLang = lang === 'hi' ? 'hi-IN' : 'en-US';
    utterance.lang = targetLang;

    // Pick appropriate voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const match = voices.find(
        (v) => v.lang === targetLang || v.lang.startsWith(targetLang.split('-')[0])
      );
      if (match) {
        utterance.voice = match;
      }
    }

    window.speechSynthesis.speak(utterance);
  }
}
