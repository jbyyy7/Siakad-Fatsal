import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon } from '../icons/SparklesIcon';

interface AIChatAssistantProps {
  onClose: () => void;
}

type Message = {
  sender: 'user' | 'ai';
  text: string;
};

const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: 'Halo! Saya Asisten AI Fathus Salafi. Ada yang bisa saya bantu dengan pelajaranmu?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (input.trim() === '') return;

    const newMessages: Message[] = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = "Tentu! Fotosintesis adalah proses di mana tumbuhan hijau menggunakan sinar matahari untuk mengubah air dan karbon dioksida menjadi makanan (glukosa) dan oksigen. Coba pikirkan, apa peran penting klorofil dalam proses ini?";
      setMessages([...newMessages, { sender: 'ai', text: aiResponse }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="fixed bottom-20 right-6 w-80 h-96 bg-white rounded-2xl shadow-2xl flex flex-col z-50 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-brand-700 text-white rounded-t-2xl">
        <div className="flex items-center">
            <SparklesIcon className="h-6 w-6 mr-2" />
            <h3 className="font-semibold">Asisten Belajar AI</h3>
        </div>
        <button onClick={onClose} className="text-white hover:text-brand-200">&times;</button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-3 py-2 rounded-xl ${msg.sender === 'user' ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
                 <div className="max-w-xs px-3 py-2 rounded-xl bg-gray-200 text-gray-500">
                    <span className="animate-pulse">...</span>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tanya tentang pelajaran..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button onClick={handleSend} className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors">
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatAssistant;

