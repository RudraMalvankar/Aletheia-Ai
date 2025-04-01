import { useState, useEffect, useCallback } from 'react';

// Define the type for the SpeechRecognition API
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: any) => void;
  onend: () => void;
  onerror: (event: any) => void;
}

// Get the correct Speech Recognition API for the browser
const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Store the recognition instance
  const recognitionRef = useCallback(() => {
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
      return null;
    }

    try {
      const recognition: ISpeechRecognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      return recognition;
    } catch (err) {
      setError('Failed to initialize speech recognition');
      return null;
    }
  }, []);

  useEffect(() => {
    const recognition = recognitionRef();
    if (!recognition) return;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');
      setTranscript(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    return () => {
      recognition.abort();
    };
  }, [recognitionRef]);

  const startListening = useCallback(() => {
    const recognition = recognitionRef();
    if (!recognition) return;

    try {
      recognition.start();
      setIsListening(true);
      setError(null);
    } catch (err) {
      setError('Failed to start speech recognition');
      setIsListening(false);
    }
  }, [recognitionRef]);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef();
    if (!recognition) return;

    try {
      recognition.stop();
      setIsListening(false);
    } catch (err) {
      setError('Failed to stop speech recognition');
    }
  }, [recognitionRef]);

  return { isListening, transcript, startListening, stopListening, error };
};