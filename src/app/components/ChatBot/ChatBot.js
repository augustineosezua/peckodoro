"use client";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const ChatBot = ({
  session,
  focused = false,
  onFocusChange,
}) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // A conversation with messages takes the stage; an empty chat hands it back to the timer
  useEffect(() => {
    onFocusChange?.(messages.length > 0);
  }, [messages.length]);

  useEffect(() => {
    if (session) {
      loadConversations();
    }
  }, [session]);

  const loadConversations = async () => {
    const res = await fetch(
      `/api/chat/conversations?userId=${session.user.id}`,
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
          content:
            "The assistant didn't answer. Check your connection and send your message again.",
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

  // Grow the composer with its content, up to a cap
  const fitInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 192) + "px";
  };

  useEffect(() => {
    if (input === "") fitInput();
  }, [input]);

  // The composer remounts when the layout switches; keep the cursor in it
  useEffect(() => {
    if (focused) inputRef.current?.focus();
  }, [focused]);

  if (!session) return null;

  const icon = (d, size = 16) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  const MENU = "M3 6H21M3 12H21M3 18H21";
  const PLUS = "M12 5V19M5 12H19";
  const CLOSE = "M18 6L6 18M6 6L18 18";
  const EXPAND = "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5";

  const sidebar = showSidebar && (
    <aside
      className={`absolute inset-y-0 left-0 z-10 flex flex-col shrink-0 bg-shell ${
        focused
          ? "w-72 md:relative md:w-64 md:bg-shell/60 border-r-2 border-ink/15"
          : "right-0 md:right-auto md:relative md:w-56 border-r-2 border-ink"
      }`}
    >
      <div className="px-3 py-3 flex items-center justify-between">
        <span className="font-semibold text-sm">Past conversations</span>
        <button
          onClick={() => setShowSidebar(false)}
          className="p-1 hover:bg-straw rounded cursor-pointer transition-colors md:hidden"
          aria-label="Close past conversations"
        >
          {icon(CLOSE, 14)}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {conversations.length === 0 ? (
          <div className="p-3 text-sm text-ink/60">
            Your conversations will show up here.
          </div>
        ) : (
          conversations.map((convo) => (
            <div
              key={convo.id}
              onClick={() => loadConversation(convo.id)}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-straw transition-colors ${
                activeConversation === convo.id ? "bg-yolk" : ""
              }`}
            >
              <span className="text-sm truncate flex-1">{convo.title}</span>
              <button
                onClick={(e) => deleteConversation(e, convo.id)}
                className="ml-2 p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-beak rounded cursor-pointer transition-all shrink-0"
                title="Delete conversation"
                aria-label="Delete conversation"
              >
                {icon(CLOSE, 12)}
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );

  const thread = (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div
        className={`min-h-full flex flex-col ${
          focused
            ? "max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-7"
            : "px-4 py-3 space-y-3"
        }`}
      >
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-4">
            <svg
              width="40"
              height="40"
              viewBox="-1 -1 26 26"
              fill="none"
              className="mb-3 [@media(max-height:820px)]:hidden"
              aria-hidden="true"
            >
              <path
                d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
                fill="var(--yolk)"
                stroke="var(--ink)"
                strokeWidth="1.5"
              />
            </svg>
            <p className="font-[family-name:var(--font-display)] font-bold text-lg">
              Stuck on something?
            </p>
            <p className="text-sm mt-1 text-ink/65 max-w-sm">
              Ask for an explanation, a practice question, or help planning
              your next session.
            </p>
          </div>
        )}
        {messages.map((msg) =>
          msg.role === "user" ? (
            <div key={msg.id} className="flex justify-end">
              <div
                className={`max-w-[80%] whitespace-pre-wrap leading-relaxed rounded-2xl ${
                  focused
                    ? "px-4 py-2.5 bg-shell border-2 border-ink/15 text-[15px]"
                    : "px-3.5 py-2 text-sm bg-ink text-shell rounded-br-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex justify-start">
              <div
                className={
                  focused
                    ? "w-full"
                    : "max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-sm bg-straw"
                }
              >
                <div
                  className={`prose prose-neutral max-w-none text-ink prose-headings:text-ink prose-headings:font-semibold prose-p:leading-relaxed prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-ink prose-code:font-mono prose-code:before:content-none prose-code:after:content-none prose-pre:bg-ink prose-pre:text-shell prose-pre:rounded-xl prose-a:text-ink prose-a:underline prose-strong:text-ink prose-li:marker:text-ink/50 ${
                    focused
                      ? "prose-base prose-code:text-sm prose-code:bg-ink/10"
                      : "prose-sm prose-code:bg-shell prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-code:text-xs prose-pre:p-3 prose-pre:my-2"
                  }`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ),
        )}
        {loading && (
          <div
            className="flex justify-start"
            aria-label="The assistant is writing"
          >
            <div
              className={`inline-flex gap-1.5 ${
                focused
                  ? "py-2"
                  : "bg-straw px-4 py-3 rounded-2xl rounded-bl-sm"
              }`}
            >
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-2 h-2 rounded-full bg-ink/50 animate-bounce motion-reduce:animate-none"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );

  const textarea = (
    <textarea
      ref={inputRef}
      rows={1}
      value={input}
      onChange={(e) => {
        setInput(e.target.value);
        fitInput();
      }}
      onKeyDown={handleKeyDown}
      placeholder={focused ? "Ask a follow-up" : "Ask a question"}
      aria-label="Message the study assistant"
      disabled={loading}
      className="flex-1 resize-none bg-transparent outline-none focus-visible:outline-none placeholder-ink/45 text-ink leading-relaxed py-2 max-h-48"
    />
  );

  const sendButton = (
    <button
      onClick={sendMessage}
      disabled={loading || !input.trim()}
      aria-label="Send message"
      className={`sticker-btn bg-beak flex items-center justify-center cursor-pointer shrink-0 ${
        focused ? "w-10 h-10 rounded-full" : "w-11 h-11 rounded-xl"
      }`}
    >
      {focused ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 19V5M5 12l7-7 7 7"
            stroke="var(--ink)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"
            fill="var(--ink)"
          />
        </svg>
      )}
    </button>
  );

  // Full-screen conversation: an open reading column, like a dedicated chat app
  if (focused) {
    return (
      <div
        className="relative w-full flex flex-1 min-h-0 overflow-hidden"
      >
        {sidebar}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <div className="flex items-center justify-between px-4 md:px-8 py-1">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              aria-expanded={showSidebar}
              className="flex items-center gap-2 px-2.5 py-1.5 text-sm font-semibold rounded-lg hover:bg-ink/10 cursor-pointer transition-colors"
            >
              {icon(MENU)}
              <span className="hidden sm:inline">
                {showSidebar ? "Hide conversations" : "Past conversations"}
              </span>
            </button>
            <button
              onClick={startNewChat}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-semibold rounded-lg hover:bg-ink/10 cursor-pointer transition-colors"
            >
              {icon(PLUS, 14)}
              New chat
            </button>
          </div>
          {thread}
          <div className="w-full max-w-3xl mx-auto px-4 md:px-6 pt-2 pb-3">
            <div className="composer sticker bg-shell rounded-3xl flex items-end gap-2 py-1.5 pl-5 pr-1.5">
              {textarea}
              {sendButton}
            </div>
            <p className="text-xs text-ink/55 text-center pt-2">
              The assistant can get things wrong. Double-check anything
              you&apos;ll be graded on.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Compact card that sits under the full timer
  return (
    <div
      className="w-full flex flex-1 min-h-0 justify-center px-4 md:px-8 pt-8 pb-6 overflow-hidden"
    >
      <div className="sticker w-full max-w-4xl flex flex-col bg-shell rounded-2xl overflow-hidden h-full">
        <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-ink shrink-0 bg-yolk">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 hover:bg-ink/10 rounded-lg cursor-pointer transition-colors"
              title="Conversations"
              aria-label="Show past conversations"
              aria-expanded={showSidebar}
            >
              {icon(MENU)}
            </button>
            <span className="font-[family-name:var(--font-display)] font-bold text-base">
              Study assistant
            </span>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 ? (
              <button
                onClick={() => onFocusChange?.(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold hover:bg-ink/10 rounded-lg cursor-pointer transition-colors"
                title="Give the chat the whole page"
              >
                {icon(EXPAND, 14)}
                Focus chat
              </button>
            ) : null}
            <button
              onClick={startNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold hover:bg-ink/10 rounded-lg cursor-pointer transition-colors"
              title="New chat"
            >
              {icon(PLUS, 14)}
              New chat
            </button>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden min-h-0 relative">
          {sidebar}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {thread}
            <div className="px-4 py-3 border-t-2 border-ink shrink-0 bg-shell">
              <div className="composer flex items-end gap-2 bg-white border-2 border-ink/25 rounded-xl pl-4 pr-1 py-1">
                {textarea}
                {sendButton}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
