import React, { useState, useEffect } from 'react';
import { LL2Launch, LL2UpcomingLaunchesResponse } from "@/lib/smartAlertTypes"; // Re-use types

// Check for SpeechRecognition API
const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
const speechSynthesis = window.speechSynthesis;

interface VoiceControlProps {
  // Props can be added later if needed, e.g., to interact with other parts of the app
}

const VoiceControl: React.FC<VoiceControlProps> = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState(''); // To provide spoken and textual feedback
  const [error, setError] = useState('');

  let recognition: SpeechRecognition | null = null;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after first speech input
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const currentTranscript = event.results[0][0].transcript;
      setTranscript(currentTranscript);
      processCommand(currentTranscript.toLowerCase());
      setIsListening(false);
    };

    recognition.onspeechend = () => {
      recognition?.stop();
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onnomatch = () => {
      setFeedback("I didn't recognize that. Please try again.");
      speak("I didn't recognize that. Please try again.");
      setIsListening(false);
    }

  } else {
    useEffect(() => {
      setError('Speech recognition is not supported by your browser.');
    }, []);
  }

  const speak = (text: string) => {
    if (speechSynthesis && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
      setFeedback(text);
    }
  };

  const processCommand = async (command: string) => {
    setFeedback(''); // Clear previous feedback
    if (command.includes('next launch') || command.includes('upcoming launch') || command.includes('launch time')) {
      try {
        const response = await fetch("https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=1&status=1,8"); // Go or TBC
        if (!response.ok) {
          throw new Error('Failed to fetch launch data.');
        }
        const data: LL2UpcomingLaunchesResponse = await response.json();
        if (data.results && data.results.length > 0) {
          const nextLaunch = data.results[0];
          const launchTime = new Date(nextLaunch.net).toLocaleString();
          const message = `The next launch is ${nextLaunch.name} by ${nextLaunch.launch_service_provider.name}, scheduled for ${launchTime}.`;
          speak(message);
        } else {
          speak("I couldn't find any upcoming launches right now.");
        }
      } catch (err: any) {
        setError(`Error fetching launch data: ${err.message}`);
        speak("Sorry, I had trouble fetching launch information.");
      }
    } else {
      speak("I'm not sure how to help with that. Try asking about the next launch.");
    }
  };

  const handleListen = () => {
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported.');
      return;
    }
    if (isListening || !recognition) {
      recognition?.stop();
      setIsListening(false);
      return;
    }
    setTranscript('');
    setError('');
    setFeedback('');
    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      setError(`Could not start recognition: ${e}`);
      setIsListening(false);
    }
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">Voice Control</h3>
      {!SpeechRecognition && <p className="text-red-500">Speech recognition not supported by this browser.</p>}
      {SpeechRecognition && (
        <button
          onClick={handleListen}
          className={`px-4 py-2 rounded font-semibold text-white ${
            isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isListening ? 'Listening...' : 'Ask about Next Launch'}
        </button>
      )}
      {transcript && <p className="mt-2">You said: <span className="italic">{transcript}</span></p>}
      {feedback && <p className="mt-2">Response: <span className="font-medium">{feedback}</span></p>}
      {error && <p className="mt-2 text-red-500">Error: {error}</p>}
    </div>
  );
};

export default VoiceControl;
