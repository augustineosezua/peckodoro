"use client";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const SUGGESTIONS = [
  "Explain a concept I'm stuck on",
  "Quiz me on what I just studied",
  "Plan my next focus session",
];

const icon = (d, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
const BACK = "M15 18l-6-6 6-6";
const CHAT =
  "M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z";

// The assistant lives in a dock beside the timer: open on a wide screen, a
// launcher on a narrow one. Nothing here moves the timer off centre.
const ChatBot = ({ session }) => {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [unread, setUnread] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Docked by default where there's room for it next to the timer
  useEffect(() => {
    setOpen(window.matchMedia("(min-width: 1024px)").matches);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (session) loadConversations();
  }, [session]);

  const loadConversations = async () => {
    const res = await fetch(`/api/chat/conversations?userId=${session.user.id}`);
    if (res.ok) {
      setConversations(await res.json());
    }
  };

  const loadConversation = async (id) => {
    const res = await fetch(`/api/chat/conversations/${id}`);
    if (res.ok) {
      const data = await res.json();
      setActiveConversation(data.id);
      setMessages(data.messages);
      setShowHistory(false);
    }
  };

  const startNewChat = () => {
    setActiveConversation(null);
    setMessages([]);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const deleteConversation = async (e, id) => {
    e.stopPropagation();
    await fetch(`/api/chat/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversation === id) startNewChat();
  };

  const sendMessage = async (text) => {
    const userMessage = (text ?? input).trim();
    if (!userMessage || loading) return;

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

    // An answer that landed while the dock was shut gets a dot on the launcher
    if (!open) setUnread(true);
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
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  useEffect(() => {
    if (input === "") fitInput();
  }, [input]);

  if (!session) return null;

  const openDock = () => {
    setOpen(true);
    setUnread(false);
  };

  if (!open) {
    return (
      <>
        {/* Wide screens: a slim rail keeps the assistant in sight */}
        <div className="hidden lg:flex shrink-0 w-14 border-l-2 border-ink/15 flex-col items-center pt-3">
          <button
            type="button"
            onClick={openDock}
            title="Open the study assistant"
            aria-label="Open the study assistant"
            className="sticker-btn bg-yolk w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer relative"
          >
            {icon(CHAT, 18)}
            {unread && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-beak border-2 border-ink" />
            )}
          </button>
        </div>
        {/* Narrow screens: a floating button, out of the timer's way */}
        <button
          type="button"
          onClick={openDock}
          aria-label="Open the study assistant"
          className="lg:hidden fixed bottom-5 right-5 z-30 sticker-btn bg-yolk w-14 h-14 rounded-full flex items-center justify-center cursor-pointer"
        >
          {icon(CHAT, 22)}
          {unread && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-beak border-2 border-ink" />
          )}
        </button>
      </>
    );
  }

  const empty = messages.length === 0;

  return (
    <>
      {/* Narrow screens only: the sheet dims the page behind it */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close the study assistant"
        onClick={() => setOpen(false)}
        className="lg:hidden fixed inset-0 z-30 bg-ink/30 cursor-default"
      />
      <aside
        className="pop-in fixed inset-y-0 right-0 z-40 w-full max-w-sm flex flex-col bg-shell border-t-2 border-l-2 border-ink
                   lg:static lg:z-auto lg:max-w-none lg:w-[26rem] lg:shrink-0"
        aria-label="Study assistant"
      >
        <div className="flex items-center gap-1 px-3 md:px-6 py-2.5 border-b-2 border-ink bg-yolk shrink-0">
          <span className="font-[family-name:var(--font-display)] font-bold text-base flex-1 truncate">
            Study assistant
          </span>
          <button
            onClick={() => setShowHistory(!showHistory)}
            aria-expanded={showHistory}
            title="Past conversations"
            aria-label="Past conversations"
            className="p-1.5 rounded-lg hover:bg-ink/10 cursor-pointer transition-colors"
          >
            {icon(MENU)}
          </button>
          <button
            onClick={startNewChat}
            title="New chat"
            aria-label="New chat"
            className="p-1.5 rounded-lg hover:bg-ink/10 cursor-pointer transition-colors"
          >
            {icon(PLUS)}
          </button>
          <button
            onClick={() => setOpen(false)}
            title="Hide the assistant"
            aria-label="Hide the assistant"
            className="p-1.5 rounded-lg hover:bg-ink/10 cursor-pointer transition-colors"
          >
            {icon(CLOSE)}
          </button>
        </div>

        <div className="relative flex-1 flex flex-col min-h-0">
          {showHistory && (
            <div className="absolute inset-0 z-10 flex flex-col bg-shell">
              <div className="flex items-center gap-2 px-2 py-2 border-b-2 border-ink/15 shrink-0">
                <button
                  onClick={() => setShowHistory(false)}
                  aria-label="Back to the conversation"
                  className="p-1.5 rounded-lg hover:bg-straw cursor-pointer transition-colors"
                >
                  {icon(BACK)}
                </button>
                <span className="font-semibold text-sm">
                  Past conversations
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {conversations.length === 0 ? (
                  <p className="p-3 text-sm text-ink/60">
                    Your conversations will show up here.
                  </p>
                ) : (
                  conversations.map((convo) => (
                    <div
                      key={convo.id}
                      onClick={() => loadConversation(convo.id)}
                      className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-straw transition-colors ${
                        activeConversation === convo.id ? "bg-yolk" : ""
                      }`}
                    >
                      <span className="text-sm truncate flex-1">
                        {convo.title}
                      </span>
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
            </div>
          )}

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="min-h-full flex flex-col px-3 md:px-6 py-4 space-y-4">
              {empty ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-1">
                  <svg
                    width="40"
                    height="40"
                    viewBox="-1 -1 26 26"
                    fill="none"
                    className="mb-3 [@media(max-height:700px)]:hidden"
                    aria-hidden="true"
                  >
                    <path
                      d={CHAT}
                      fill="var(--yolk)"
                      stroke="var(--ink)"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <p className="font-[family-name:var(--font-display)] font-bold text-lg">
                    Stuck on something?
                  </p>
                  <p className="text-sm mt-1 text-ink/65">
                    Ask while the timer runs — it keeps going.
                  </p>
                  <div className="w-full flex flex-col gap-2 pt-5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="sticker-btn bg-shell rounded-xl px-3 py-2 text-sm font-semibold text-left cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {messages.map((msg) =>
                msg.role === "user" ? (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap leading-relaxed rounded-2xl rounded-br-sm px-3.5 py-2 text-sm bg-ink text-shell">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div
                    key={msg.id}
                    className="prose prose-neutral prose-sm max-w-none text-ink prose-headings:text-ink prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1.5 prose-p:leading-relaxed prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:bg-ink/10 prose-code:text-ink prose-code:font-mono prose-code:before:content-none prose-code:after:content-none prose-pre:bg-ink prose-pre:text-shell prose-pre:rounded-xl prose-pre:p-3 prose-pre:my-2 prose-a:text-ink prose-a:underline prose-strong:text-ink prose-li:marker:text-ink/50"
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ),
              )}
              {loading && (
                <div
                  className="inline-flex gap-1.5 py-1"
                  aria-label="The assistant is writing"
                >
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-2 h-2 rounded-full bg-ink/50 animate-bounce motion-reduce:animate-none"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 80px tall with the music bar's padding, so both rules line up */}
          <div className="px-3 md:px-6 py-1 min-h-20 flex flex-col justify-center border-t-2 border-ink shrink-0">
            <div className="composer flex items-end gap-2 bg-white border-2 border-ink/25 rounded-2xl pl-4 pr-1 py-1">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  fitInput();
                }}
                onKeyDown={handleKeyDown}
                placeholder={empty ? "Ask a question" : "Ask a follow-up"}
                aria-label="Message the study assistant"
                disabled={loading}
                className="flex-1 resize-none bg-transparent outline-none focus-visible:outline-none placeholder-ink/45 text-ink text-sm leading-relaxed py-2 max-h-40"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="sticker-btn bg-beak w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer shrink-0"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"
                    fill="var(--ink)"
                  />
                </svg>
              </button>
            </div>
            <p className="text-[11px] leading-tight text-ink/55 text-center pt-1">
              Double-check anything you&apos;ll be graded on.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default ChatBot;
