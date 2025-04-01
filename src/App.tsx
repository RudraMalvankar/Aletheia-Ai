import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Send, Volume2, VolumeX } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import type { Message, ChatState } from './types';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyDscy7dVxSHuGcL93TLs_JUZTPagBmCHYg'); // Replace with actual API key
// const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);


const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Voice Cache
const voiceCache = new Map<string, SpeechSynthesisUtterance>();

function App() {
  const [input, setInput] = useState('');
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isListening: false, // 🔹 Added this to match ChatState type
    error: null,
  });
  
  const [isSpeaking, setIsSpeaking] = useState(false); // Track AI speech state

  const { transcript } = useSpeechRecognition();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatState.messages]);

  // ** Speak Function with Caching & State Tracking **
  const speak = (text: string) => {
    if (!text) return;

    if (voiceCache.has(text)) {
      const utterance = voiceCache.get(text)!;
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.name.includes("Google")) || voices[0];
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onend = () => setIsSpeaking(false); // Stop tracking speech when done
    voiceCache.set(text, utterance);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Toggle AI Speech
  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel(); // Stop completely
      setIsSpeaking(false);
    } else {
      // Get the latest AI message
      const latestMessage = chatState.messages
        .filter(msg => msg.role === 'assistant')
        .pop()?.content;
  
      if (latestMessage) {
        speak(latestMessage); // Speak the latest AI message
      }
    }
  };
  

  const handleSend = async () => {
    if (!input.trim() || chatState.isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));
    setInput('');

    try {
      const chat = model.startChat({
        history: chatState.messages.map(msg => ({
          role: msg.role,
          parts: msg.content,
        })),
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      const result = await chat.sendMessage(input);
      const response = await result.response;
      const botMessage: Message = {
        role: 'assistant',
        content: response.text(),
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, botMessage],
        isLoading: false,
      }));

      speak(botMessage.content); // Speak AI response
    } catch (error) {
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to get response from AI',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-semibold text-gray-800">Aletheia Ai</h1>
          <p className="text-gray-600">A safe space for supportive conversations</p>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col">
        <div ref={chatContainerRef} className="flex-1 space-y-4 overflow-y-auto mb-4">
          {chatState.messages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))}
          {chatState.isLoading && <div className="text-center text-gray-500">AI is thinking...</div>}
          {chatState.error && <div className="text-center text-red-500">{chatState.error}</div>}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2">
            {/* Speak Button (Stop / Continue AI Speech) */}
            <button
              onClick={toggleSpeech}
              className={`p-2 rounded-full transition-all duration-300 transform hover:scale-105 ${
                isSpeaking ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}
              title="Toggle AI Speech"
            >
              {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            

            {/* Input Field */}
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={chatState.isLoading}
              className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
