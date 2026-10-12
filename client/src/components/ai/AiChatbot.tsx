import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  Bot,
  Send,
  Trash2,
  X,
  Minimize2,
  AlertCircle,
  RotateCcw,
  User as UserIcon,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { ChatMessage } from '../../types';

const SUGGESTED_PROMPTS = [
  {
    icon: Flame,
    title: 'What should I prioritize today?',
    prompt: 'Look at my current tasks and tell me what I should prioritize today based on urgency and deadlines.',
  },
  {
    icon: Calendar,
    title: 'Suggest a daily schedule',
    prompt: 'Suggest a productive daily schedule and time-blocking plan for tackling my pending tasks today.',
  },
  {
    icon: Clock,
    title: 'Summarize pending & overdue tasks',
    prompt: 'Summarize my pending, in-progress, and overdue tasks with their current status and due dates.',
  },
  {
    icon: CheckCircle2,
    title: 'Break down high-priority tasks',
    prompt: 'Identify my most urgent or high-priority task and break it down into 3-5 concrete action steps.',
  },
];

export const AiChatbot: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  // Handle clearing chat
  const handleClearChat = () => {
    setMessages([]);
    setErrorMessage(null);
  };

  // Send message
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || isLoading) return;

    setErrorMessage(null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build history for backend (excluding any error messages)
      const historyPayload = messages
        .filter((m) => !m.isError)
        .slice(-8)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await api.ai.chat(textToSend, historyPayload);

      const aiMessage: ChatMessage = {
        id: `model-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: 'model',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      const errorMsg =
        err?.message || 'Unable to connect to the AI service. Please try again.';

      setErrorMessage(errorMsg);

      const errorNotice: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `⚠️ **Unable to complete request:** ${errorMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };

      setMessages((prev) => [...prev, errorNotice]);
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard navigation: Enter sends, Shift+Enter newlines
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? 'Close AI Assistant' : 'Open ORBIT AI Assistant'}
          className={`group relative flex items-center justify-center p-3.5 sm:p-4 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 ${
            isOpen
              ? 'bg-slate-800 text-white dark:bg-slate-700 hover:bg-slate-900 ring-2 ring-indigo-500/50'
              : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white hover:shadow-indigo-500/30 hover:scale-105'
          }`}
        >
          {/* Subtle pulse ring when closed */}
          {!isOpen && (
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50 blur-sm group-hover:opacity-80 transition duration-300 animate-pulse" />
          )}

          <div className="relative flex items-center gap-2">
            {isOpen ? (
              <X className="w-6 h-6 transition-transform group-hover:rotate-90 duration-200" />
            ) : (
              <>
                <Sparkles className="w-6 h-6 transition-transform group-hover:scale-110 duration-200" />
                <span className="hidden lg:inline-block text-xs font-semibold tracking-wide pr-1">
                  Ask ORBIT AI
                </span>
              </>
            )}
          </div>

          {/* Online green indicator dot */}
          {!isOpen && (
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </span>
          )}
        </button>
      </div>

      {/* Floating AI Chat Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="ORBIT AI Assistant Chat Panel"
          className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] md:w-[460px] h-[600px] max-h-[calc(100vh-7.5rem)] bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-[#0F172A] dark:to-indigo-950/20 border-b border-slate-200 dark:border-slate-800 select-none">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    ORBIT AI
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                      Gemini Flash Lite
                    </span>
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Task-Aware Productivity OS</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  title="Clear conversation"
                  aria-label="Clear chat history"
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
                aria-label="Close chat panel"
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-slate-50/50 dark:bg-[#0B0F19]/50">
            {/* Welcome State when conversation is empty */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-4 px-2 space-y-4 animate-in fade-in duration-300">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-1">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Welcome, {user?.name || 'Commander'}!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    I am your ORBIT productivity assistant. I have live awareness of your active tasks, deadlines, and priorities.
                  </p>
                </div>

                {/* Quick Suggestion Chips */}
                <div className="w-full space-y-2 pt-2 text-left">
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                    Suggested Quick Actions
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {SUGGESTED_PROMPTS.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(item.prompt)}
                          disabled={isLoading}
                          className="group flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-sm text-left transition-all duration-150 disabled:opacity-50"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                              {item.title}
                            </span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Render Chat Messages */}
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                >
                  {/* Model Avatar */}
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs sm:text-[13px] leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : msg.isError
                        ? 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200 rounded-bl-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-xs dark:prose-invert max-w-none space-y-1.5 [&>p]:mb-1.5 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:my-1.5 [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:my-1.5 [&>li]:my-0.5 [&>strong]:font-semibold [&>code]:bg-slate-100 dark:[&>code]:bg-slate-800 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-[11px]">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}

                    <div
                      className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                        isUser
                          ? 'text-indigo-200'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 shadow-sm mt-0.5">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start animate-in fade-in duration-200">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl rounded-bl-xs px-3.5 py-2.5 shadow-sm flex items-center gap-2">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" />
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Analyzing tasks & generating advice...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Banner if last request failed */}
          {errorMessage && (
            <div className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 border-t border-rose-200 dark:border-rose-900/40 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
              <div className="flex items-center gap-1.5 truncate pr-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="truncate">{errorMessage}</span>
              </div>
              <button
                onClick={() => handleSendMessage()}
                className="flex items-center gap-1 font-medium hover:underline shrink-0 text-rose-600 dark:text-rose-400"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}

          {/* Footer Input Area */}
          <div className="p-3 bg-white dark:bg-[#0F172A] border-t border-slate-200 dark:border-slate-800">
            <div className="relative rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#0B0F19] focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-colors">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask ORBIT AI about your tasks, priorities..."
                rows={2}
                maxLength={2000}
                disabled={isLoading}
                className="w-full resize-none bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none disabled:opacity-50"
              />

              <div className="flex items-center justify-between px-2.5 pb-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {inputMessage.length > 0 ? `${inputMessage.length}/2000` : 'Enter to send, Shift+Enter for new line'}
                </span>

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  aria-label="Send message to AI"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
                >
                  <span>Send</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="mt-1.5 text-center">
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Task-aware read-only copilot · Suggestions do not modify data
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
