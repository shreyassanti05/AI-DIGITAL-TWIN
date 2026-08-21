'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  X, 
  MessageSquare, 
  Bot, 
  Send,
  Sparkles,
  Activity,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your AI surveillance assistant. How can I help you today?\n\nYou can ask me things like:\n• "Show all high threat incidents from today"\n• "What cameras are currently offline?"\n• "Generate a report for zone A"',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses: Record<string, string> = {
        'threat': 'I found 3 high threat incidents in the last 24 hours:\n\n1. Zone A - Suspicious loitering (94% confidence)\n2. Zone C - Weapon detected (89% confidence)\n3. Zone B - Crowd anomaly (87% confidence)\n\nWould you like me to show you the video footage?',
        'camera': 'Currently monitoring 24 cameras:\n\n✅ Online: 22\n⚠️ Warning: 1 (Camera 07 - low FPS)\n❌ Offline: 1 (Camera 12 - connection lost 5 min ago)',
        'report': 'I can generate a comprehensive security report. What time period would you like?\n\nOptions:\n• Last hour\n• Last 24 hours\n• Last week\n• Custom range',
        'default': 'I understand. Let me process that request for you. I can help with:\n\n• Threat analysis and alerts\n• Camera status monitoring\n• Incident reports and analytics\n• System configuration\n• Real-time surveillance queries\n\nWhat would you like to know?',
      };

      const response = Object.entries(responses).find(([key]) => 
        input.toLowerCase().includes(key)
      )?.[1] || responses.default;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      // Simulate voice recognition
      setTimeout(() => {
        setInput('Show high threat incidents');
        setIsListening(false);
      }, 2000);
    }
  };

  return (
    <>
      {/* Floating AI Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="relative w-16 h-16 rounded-full bg-gradient-to-r from-cyber-blue to-cyber-purple hover:from-cyber-blue-light hover:to-cyber-purple-light shadow-cyber-glow-lg transition-all duration-300 group"
            >
              <Bot className="w-8 h-8 text-white" />
              
              {/* Pulse Ring */}
              <span className="absolute inset-0 rounded-full bg-cyber-blue/30 animate-ping" />
              
              {/* AI Status Indicator */}
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyber-green rounded-full border-2 border-cyber-dark animate-pulse" />
              
              {/* Tooltip */}
              <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-cyber-dark/90 border border-cyber-blue/30 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                AI Assistant
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[500px] glass-panel rounded-2xl overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-cyber-blue/10 to-cyber-purple/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyber-blue to-cyber-purple flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-cyber-green rounded-full border-2 border-cyber-dark animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">AI Surveillance Assistant</h3>
                  <div className="flex items-center gap-1 text-xs text-cyber-green">
                    <Activity className="w-3 h-3" />
                    <span>Online</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-xl text-sm ${
                      message.role === 'user'
                        ? 'bg-cyber-blue/20 border border-cyber-blue/30 text-white'
                        : 'bg-white/5 border border-white/10 text-white'
                    }`}
                  >
                    <div className="whitespace-pre-line">{message.content}</div>
                    <div className="text-xs text-white/40 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyber-blue animate-pulse" />
                      <span className="text-sm text-white/60">AI is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-cyber-dark/50">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleListening}
                  className={`shrink-0 ${
                    isListening 
                      ? 'bg-cyber-red/20 text-cyber-red animate-pulse' 
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me anything about surveillance..."
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyber-blue"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  size="icon"
                  className="shrink-0 bg-cyber-blue hover:bg-cyber-blue-light text-cyber-dark disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-2 text-xs text-white/40 text-center">
                Press Enter to send • Use voice for hands-free control
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
