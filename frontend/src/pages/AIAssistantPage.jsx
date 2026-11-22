import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RotateCcw,
  User,
  Zap,
  TrendingDown,
  PieChart,
  ShieldAlert,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const AIAssistantPage = () => {
  const { user, formatCurrency } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState([]);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const messagesEndRef = useRef(null);

  const loadChat = async () => {
    try {
      const [histRes, promptsRes] = await Promise.all([
        api.ai.getHistory(),
        api.ai.getQuickPrompts(),
      ]);
      setMessages(histRes || []);
      setQuickPrompts(promptsRes || []);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    loadChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.ai.sendMessage(textToSend);
      const botMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.message,
        source: res.source,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Error: ${err.message || 'Unable to connect to AI advisory service.'}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset conversation history?')) {
      try {
        await api.ai.resetChat();
        loadChat();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Helper to render markdown-like formatting (bold, tables, bullets)
  const renderFormattedContent = (content) => {
    const lines = content.split('\n');
    let inTable = false;
    let tableRows = [];

    const rendered = [];

    lines.forEach((line, i) => {
      // Markdown table detection
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        tableRows.push(line);
        return;
      } else if (inTable) {
        inTable = false;
        rendered.push(renderTable(tableRows, `table-${i}`));
        tableRows = [];
      }

      // Headers
      if (line.startsWith('### ')) {
        rendered.push(
          <h4 key={i} className="text-sm font-bold text-sky-400 mt-3 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      } else if (line.startsWith('## ')) {
        rendered.push(
          <h3 key={i} className="text-base font-bold text-white mt-3 mb-1.5">
            {line.replace('## ', '')}
          </h3>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        rendered.push(
          <li key={i} className="ml-4 list-disc text-slate-300 text-xs my-0.5">
            {renderInlineMarkdown(line.substring(2))}
          </li>
        );
      } else if (/^\d+\.\s/.test(line)) {
        rendered.push(
          <li key={i} className="ml-4 list-decimal text-slate-300 text-xs my-0.5">
            {renderInlineMarkdown(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
      } else if (line.trim() === '') {
        rendered.push(<div key={i} className="h-2" />);
      } else {
        rendered.push(
          <p key={i} className="text-xs text-slate-300 leading-relaxed">
            {renderInlineMarkdown(line)}
          </p>
        );
      }
    });

    if (inTable && tableRows.length > 0) {
      rendered.push(renderTable(tableRows, `table-end`));
    }

    return rendered;
  };

  const renderInlineMarkdown = (text) => {
    // Bold replacement
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const renderTable = (rows, key) => {
    const parsedRows = rows.map((r) =>
      r
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell, idx, arr) => idx !== 0 && idx !== arr.length - 1)
    );

    if (parsedRows.length < 2) return null;

    const headers = parsedRows[0];
    const bodyRows = parsedRows.slice(2); // Skip separator

    return (
      <div key={key} className="my-3 overflow-x-auto rounded-xl border border-[#1A2A4A]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#091224] text-slate-300 font-bold border-b border-[#1A2A4A]">
            <tr>
              {headers.map((h, idx) => (
                <th key={idx} className="px-3 py-2">
                  {renderInlineMarkdown(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A2A4A]/60 bg-[#0D182E]/50">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-[#1A2A4A]/20">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 text-slate-300">
                    {renderInlineMarkdown(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] fintech-card overflow-hidden">
      {/* Chat Top Banner */}
      <div className="px-6 py-4 border-b border-[#1A2A4A] bg-[#091224] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 via-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">FinPilot AI Copilot</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                Context-Aware Financial LLM
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Personalized advisory powered by your real-time transaction ledger & budget telemetry
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          title="Reset Conversation"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D182E] border border-[#1A2A4A] text-slate-400 hover:text-white text-xs transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Chat</span>
        </button>
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="px-6 py-2.5 bg-[#070D1E] border-b border-[#1A2A4A]/60 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
          <Zap className="w-3.5 h-3.5 text-sky-400" /> Prompts:
        </span>
        {quickPrompts.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSend(p.prompt)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-[#0D182E] hover:bg-[#132140] border border-[#1A2A4A] hover:border-sky-500/40 text-slate-300 hover:text-white text-[11px] font-medium whitespace-nowrap transition-all active:scale-95 disabled:opacity-50"
          >
            {p.prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[#070D1E]/40">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id || idx}
              className={`flex gap-3.5 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-tr from-purple-600 to-sky-500 text-white shadow-md'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl p-4 text-xs relative group ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-[#0D182E] border border-[#1A2A4A] text-slate-200 rounded-tl-none shadow-lg'
                }`}
              >
                {isUser ? (
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div>
                    {renderFormattedContent(msg.content)}

                    {/* Source Attribution & Copy Tool */}
                    <div className="mt-3 pt-2 border-t border-[#1A2A4A]/50 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Sparkles className="w-3 h-3 text-sky-400" />
                        {msg.source || 'FinPilot Financial Engine'}
                      </span>
                      <button
                        onClick={() => handleCopy(msg.content, idx)}
                        className="text-slate-400 hover:text-white flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity"
                      >
                        {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3.5 max-w-2xl mr-auto animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-sky-500 flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#0D182E] border border-[#1A2A4A] rounded-2xl p-4 text-xs text-sky-400 rounded-tl-none flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-sky-400" />
              <span>Analyzing financial models and synthesizing recommendation...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-4 bg-[#091224] border-t border-[#1A2A4A] flex gap-3">
        <input
          type="text"
          placeholder="Ask: 'Where did I spend most of my money?' or 'Suggest an emergency fund plan'..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-3 bg-[#0D182E] border border-[#1A2A4A] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 flex items-center gap-1.5 disabled:opacity-50 transition-all active:scale-95"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
