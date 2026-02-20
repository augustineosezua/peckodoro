"use client";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const ChatBot = ({ session, spotifyExists }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (session) {
      loadConversations();
    }
  }, [session]);

  const loadConversations = async () => {
    const res = await fetch(
      `/api/chat/conversations?userId=${session.user.id}`
    );
    if (res.ok) {
      const data = await res.json();
      setConversations(data);
    }
  };

  const loadConversation = async (id) => {
    const res = await fetch(`/api/chat/conversations/${id}`);
    if (res.ok) {
      const data = await res.json();
      setActiveConversation(data.id);
      setMessages(data.messages);
      setShowSidebar(false);
    }
  };

  const startNewChat = () => {
    setActiveConversation(null);
    setMessages([]);
    setShowSidebar(false);
  };

  const deleteConversation = async (e, id) => {
    e.stopPropagation();
    await fetch(`/api/chat/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversation === id) {
      startNewChat();
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, id: Date.now().toString() },
    ]);
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: activeConversation,
        message: userMessage,
        userId: session.user.id,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setActiveConversation(data.conversationId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, id: data.messageId },
      ]);
      loadConversations();
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          id: "error-" + Date.now(),
        },
      ]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!session) return null;

  return (
    <div className={`w-full flex flex-1 justify-center px-4 md:px-8 pt-10 font-[family-name:var(--font-geist-sans)] overflow-hidden ${spotifyExists ? "pb-36" : "pb-24"}`}>
      <div className="w-full max-w-5xl flex flex-col bg-[#f5edd8]/80 backdrop-blur-sm rounded-2xl border border-[#E0D7C3]/50 shadow-lg overflow-hidden h-full max-h-[80vh]">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E0D7C3]/50 shrink-0 bg-[#f0e6ce]/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 hover:bg-[#E9CBA7] rounded-lg cursor-pointer transition-colors"
              title="Conversations"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 6H21M3 12H21M3 18H21"
                  stroke="#54494B"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <span className="font-semibold text-sm text-[#54494B]">
              Peckodoro AI
            </span>
          </div>
          <button
            onClick={startNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#54494B] hover:bg-[#E9CBA7] rounded-lg cursor-pointer transition-colors"
            title="New chat"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5V19M5 12H19"
                stroke="#54494B"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            New Chat
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0 relative">
          {/* Sidebar — slides over on mobile, sits inline on larger screens when toggled */}
          {showSidebar && (
            <div className="absolute md:relative inset-0 md:inset-auto md:w-56 bg-[#f0e6ce]/90 backdrop-blur-sm z-10 flex flex-col border-r border-[#E0D7C3]/50 shrink-0">
              <div className="p-3 border-b border-[#E0D7C3]/50 flex items-center justify-between">
                <span className="font-semibold text-xs text-[#54494B] uppercase tracking-wide">
                  History
                </span>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-1 hover:bg-[#E9CBA7] rounded cursor-pointer transition-colors md:hidden"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 6L6 18M6 6L18 18"
                      stroke="#54494B"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-4 text-xs text-gray-400 text-center">
                    No conversations yet
                  </div>
                ) : (
                  conversations.map((convo) => (
                    <div
                      key={convo.id}
                      onClick={() => loadConversation(convo.id)}
                      className={`group flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-[#E9CBA7] transition-colors ${
                        activeConversation === convo.id ? "bg-[#E9CBA7]" : ""
                      }`}
                    >
                      <span className="text-xs truncate flex-1 text-[#54494B]">
                        {convo.title}
                      </span>
                      <button
                        onClick={(e) => deleteConversation(e, convo.id)}
                        className="ml-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-[#C86B5A] hover:text-white rounded cursor-pointer transition-all shrink-0"
                        title="Delete"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M18 6L6 18M6 6L18 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Messages area */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mb-2 opacity-30"
                  >
                    <path
                      d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
                      fill="#d4c9ad"
                    />
                  </svg>
                  <p className="text-sm">Ask me anything</p>
                  <p className="text-xs mt-0.5 text-gray-300">
                    Study tips, productivity advice, or general questions
                  </p>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div className="max-w-[75%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed bg-[#54494B] text-white rounded-br-sm">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-sm bg-[#E9CBA7] text-[#3d3537]">
                      <div className="prose prose-sm prose-neutral prose-headings:text-[#3d3537] prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1.5 prose-p:leading-relaxed prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-code:bg-[#d4c9ad] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[#3d3537] prose-code:font-mono prose-code:text-xs prose-pre:bg-[#3d3537] prose-pre:text-[#f5edd8] prose-pre:rounded-lg prose-pre:p-3 prose-pre:my-2 prose-a:text-[#54494B] prose-a:underline prose-strong:text-[#3d3537] max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#E9CBA7] text-[#54494B] px-3.5 py-2 rounded-2xl rounded-bl-sm text-sm">
                    <span className="inline-flex gap-1">
                      <span
                        className="animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      >
                        .
                      </span>
                      <span
                        className="animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      >
                        .
                      </span>
                      <span
                        className="animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      >
                        .
                      </span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="px-4 py-3 border-t border-[#E0D7C3] shrink-0 bg-[#f0e6ce]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 bg-[#E9CBA7] rounded-xl px-4 py-2.5 text-sm outline-none placeholder-[#A89279] text-[#54494B]"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="w-10 h-10 bg-[#54494B] text-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#6b5f61] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"
                      fill="white"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
