'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Hello! How can I help you today?', sender: 'bot' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasSetApiKey, setHasSetApiKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'X-API-KEY': apiKey }),
        },
        body: JSON.stringify({ message: inputValue }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const botMessage: Message = {
          id: messages.length + 2,
          text: data.response,
          sender: 'bot',
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        console.error('Error:', data.error);
        const errorMessage: Message = {
          id: messages.length + 2,
          text: 'Sorry, there was an error processing your request.',
          sender: 'bot',
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: messages.length + 2,
        text: 'Sorry, there was an error connecting to the server.',
        sender: 'bot',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Focus on input after response
      inputRef.current?.focus();
    }
  };

  const saveApiKey = () => {
    if (apiKey.trim()) {
      setHasSetApiKey(true);
      setShowSettings(false);
      
      // Add a confirmation message
      const confirmMessage: Message = {
        id: messages.length + 1,
        text: 'API key has been set. You can now ask questions to get more accurate AI-powered responses.',
        sender: 'bot',
      };
      setMessages((prev) => [...prev, confirmMessage]);
    }
  };

  return (
    <div className="flex flex-col h-[80vh] max-w-2xl mx-auto border border-gray-300 rounded-lg overflow-hidden shadow-lg">
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">AI Chat Assistant</h1>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="text-sm px-2 py-1 rounded bg-blue-700 hover:bg-blue-800 transition-colors"
        >
          {showSettings ? 'Close' : 'Settings'}
        </button>
      </div>
      
      {showSettings && (
        <div className="bg-gray-100 p-4 border-b border-gray-300">
          <h2 className="text-lg font-semibold mb-2">API Settings</h2>
          <div className="flex items-center mb-2">
            <input
              type="password"
              placeholder="Enter your OpenAI API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 mr-2"
            />
            <button
              onClick={saveApiKey}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Save
            </button>
          </div>
          <p className="text-xs text-gray-600">
            Your API key will be used only for this session and won't be stored on the server.
            {hasSetApiKey && " An API key has been set for this session."}
          </p>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-xs md:max-w-md rounded-lg p-3 bg-gray-200 text-gray-800 rounded-bl-none">
              <div className="flex space-x-2">
                <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="border-t border-gray-300 p-4 bg-white">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading || !inputValue.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 