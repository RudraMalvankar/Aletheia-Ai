export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isListening: boolean;
  error: string | null;
}