import { GoogleGenAI } from '@google/genai';
import React, { useState, useRef, useEffect } from 'react';
import { XIcon } from '../icons/XIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { ArrowPathIcon } from '../icons/ArrowPathIcon';

interface AIChatAssistantProps {
  onClose: () => void;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ onClose }) => {
  const initialMessage: Message = { sender: 'ai', text: 'Halo! Saya asisten AI. Ada yang bisa saya bantu jelaskan tentang pelajaran hari ini?' };
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  const handleReset = () => {
      setMessages([initialMessage]);
  }

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let fullResponseText = '';
    const aiMessage: Message = { sender: 'ai', text: '' };
    setMessages(prev => [...prev, aiMessage]); // Add placeholder for streaming

    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: `You are an AI assistant helping a student understand their lessons. Keep your answers concise and easy to understand. Question: ${input}`,
        config: {
          systemInstruction: 'You are a helpful AI assistant for students in an academic information system. Your name is "Asisten Cerdas". Your goal is to explain complex topics simply.'
        }
      });

      for await (const chunk of responseStream) {
        fullResponseText += chunk.text;
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { sender: 'ai', text: fullResponseText + '...' };
            return newMessages;
        });
      }
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { sender: 'ai', text: fullResponseText };
        return newMessages;
      });

    } catch (err) {
      console.error("AI chat error:", err);
      const errorMessage = 'Maaf, terjadi kesalahan. Silakan coba lagi nanti.';
       setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { sender: 'ai', text: errorMessage };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 right-0 mb-24 mr-6 w-80 h-[28rem] bg-white rounded-xl shadow-2xl flex flex-col z-50 animate-fade-in-up">
      <header className="flex items-center justify-between p-3 bg-brand-700 text-white rounded-t-xl">
        <div className="flex items-center">
          <SparklesIcon className="h-6 w-6 mr-2" />
          <h3 className="font-semibold">Asisten Cerdas</h3>
        </div>
        <div>
            <button onClick={handleReset} className="p-1 rounded-full hover:bg-brand-600 mr-2" title="Mulai Ulang Percakapan">
                <ArrowPathIcon className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-brand-600" title="Tutup">
                <XIcon className="h-5 w-5" />
            </button>
        </div>
      </header>
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-3">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-2 rounded-lg ${msg.sender === 'user' ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length-1].text.endsWith("...") && (
            <div ref={messagesEndRef} />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <footer className="p-3 border-t">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tanya apa saja..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading} className="ml-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:bg-brand-400">
            Kirim
          </button>
        </div>
      </footer>
    </div>
  );
};

export default AIChatAssistant;
