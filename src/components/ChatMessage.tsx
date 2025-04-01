import React from 'react';
import { Message } from '../types';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.role === 'assistant';

  return (
    <div
      className={`flex items-start gap-4 ${
        isBot ? 'bg-gray-50' : 'bg-white'
      } p-4 rounded-lg`}
    >
      <div
        className={`p-2 rounded-full ${
          isBot ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
        }`}
      >
        {isBot ? <Bot size={24} /> : <User size={24} />}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-600">{isBot ? 'AI Therapist' : 'You'}</p>
        <p className="mt-1 text-gray-800">{message.content}</p>
      </div>
    </div>
  );
};