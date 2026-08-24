import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { cn } from "../../utils";
import { formatTime } from "../../utils/date";
import { useAuthStore } from "../../store/authStore";
import ragChatService from "../../lib/rag-chat/ragChatService";
import type { ChatMessage } from "../../lib/rag-chat/types";

// The RAG service currently indexes a single storefront's catalog.
const STORE_DOMAIN = "www.echopartsonline.com";
const LANG = "en-US";

type Rating = "good" | "neutral" | "bad";

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? "Agent", lastName: "Agent" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function getInitials(name?: string): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function renderAnswer(text?: string) {
  if (!text) return null;

  const renderer = new marked.Renderer();
  renderer.link = ({ href, title, tokens }) => {
    const label = tokens.map((token) => token.raw).join("");
    return `<a href="${href}" target="_blank" rel="noopener noreferrer"${title ? ` title="${title}"` : ""}>${label}</a>`;
  };

  const rawHtml = marked.parse(text, { renderer }) as string;
  const html = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      "b", "strong", "i", "em", "u", "br", "p", "ul", "ol", "li",
      "a", "span", "code", "pre", "blockquote", "h1", "h2", "h3", "h4",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "title"],
  });

  return (
    <div
      className="text-sm leading-relaxed [&_a]:font-medium [&_a]:text-brand-600 [&_a]:underline [&_a]:underline-offset-2 dark:[&_a]:text-brand-400 [&_ol]:list-decimal [&_ol]:pl-4 [&_p+p]:mt-2 [&_ul]:list-disc [&_ul]:pl-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function BotIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2l1.6 3.8L17.5 7l-3.9 1.2L12 12l-1.6-3.8L6.5 7l3.9-1.2L12 2z"
        fill="currentColor"
      />
      <path
        d="M6 14.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M18 13.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M2 21l20-9L2 3v6l14 3L2 15v6z" fill="currentColor" />
    </svg>
  );
}

function SpinnerIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Avatar({ who, userName }: { who: ChatMessage["who"]; userName?: string }) {
  if (who === "user") {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[11px] font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-300">
        {getInitials(userName)}
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-sm shadow-brand-500/30">
      <BotIcon />
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex animate-message-in items-end gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-sm shadow-brand-500/30">
        <BotIcon />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s] dark:bg-gray-500" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s] dark:bg-gray-500" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500" />
      </div>
    </div>
  );
}

function EndChatConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="flex animate-message-in items-end gap-2.5">
      <Avatar who="assistant" />
      <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">
          Are you sure you want to end this conversation?
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-red-700"
          >
            Yes, end chat
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-gray-200 px-3.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Keep chatting
          </button>
        </div>
      </div>
    </div>
  );
}

function RatingForm({ onSubmit }: { onSubmit: (rating: Rating, comment?: string) => void }) {
  const [rating, setRating] = useState<Rating | null>(null);
  const [comment, setComment] = useState("");

  const options: { value: Rating; emoji: string; label: string }[] = [
    { value: "good", emoji: "😊", label: "Good" },
    { value: "neutral", emoji: "😐", label: "Neutral" },
    { value: "bad", emoji: "😞", label: "Bad" },
  ];

  return (
    <div className="flex animate-message-in items-end gap-2.5">
      <Avatar who="assistant" />
      <div className="w-full max-w-[85%] rounded-2xl rounded-bl-md border border-gray-100 bg-white px-4 py-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          How was this conversation?
        </p>
        <div className="mb-3 flex gap-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRating(option.value)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-medium text-gray-600 transition-all dark:text-gray-300",
                rating === option.value
                  ? "border-brand-400 bg-brand-50 shadow-sm dark:border-brand-500/40 dark:bg-brand-500/10"
                  : "border-gray-200 hover:border-gray-300 dark:border-white/10 dark:hover:border-white/20",
              )}
            >
              <span className="text-xl">{option.emoji}</span>
              {option.label}
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={2}
          placeholder="Comment (optional)"
          className="mb-3 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-300"
        />
        <button
          type="button"
          disabled={!rating}
          onClick={() => rating && onSubmit(rating, comment.trim() || undefined)}
          className="w-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-brand-500/30 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          Submit rating
        </button>
      </div>
    </div>
  );
}

export default function PartsCompatChat() {
  const user = useAuthStore((state) => state.user);

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [conversationEnded, setConversationEnded] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showRating, setShowRating] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState(640);

  // Stretch the panel all the way to the bottom of the viewport, shrinking/growing
  // with it, instead of using a fixed height that leaves dead space or gets cramped.
  useEffect(() => {
    function updateHeight() {
      if (!panelRef.current) return;
      const top = panelRef.current.getBoundingClientRect().top;
      const next = Math.max(480, window.innerHeight - top - 24);
      setPanelHeight(next);
    }

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const welcomeMessage = (): ChatMessage => ({
    id: crypto.randomUUID(),
    who: "assistant",
    text: "Hi! Ask me about parts compatibility, models or serial ranges.",
    createdAt: new Date().toISOString(),
  });

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  // Resolve (or create) the RAG customer record for the logged-in agent.
  // conversation_id always starts fresh — it is not persisted across page loads.
  useEffect(() => {
    if (!user?.email) {
      setCustomerLoading(false);
      setCustomerError("No authenticated user found.");
      return;
    }

    const { firstName, lastName } = splitName(user.name ?? user.email);

    setCustomerLoading(true);
    setCustomerError(null);

    ragChatService
      .createCustomer({ name: firstName, lastName, email: user.email })
      .then((customer) => {
        setCustomerId(customer.id);
        setMessages([welcomeMessage()]);
      })
      .catch(() => {
        setCustomerError("Could not start the chat session.");
      })
      .finally(() => setCustomerLoading(false));
  }, [user?.email, user?.name, retryTick]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, typing, showEndConfirm, showRating]);

  const composerDisabled =
    customerLoading || !!customerError || conversationEnded || typing || showEndConfirm || showRating;

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.max(40, Math.min(128, el.scrollHeight))}px`;
  }

  async function send(text: string) {
    const question = text.trim();
    if (!question || !customerId) return;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), who: "user", text: question, createdAt: new Date().toISOString() },
    ]);
    setTyping(true);

    try {
      const response = await ragChatService.askQuestion({
        customer_id: customerId,
        conversation_id: conversationId ?? undefined,
        question,
        lang: LANG,
        store_domain: STORE_DOMAIN,
      });

      if (response.conversation_id) setConversationId(response.conversation_id);

      if (response.answer?.trim()) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            who: "assistant",
            text: response.answer,
            createdAt: new Date().toISOString(),
          },
        ]);
      }

      if (response.close_chat) {
        setTimeout(() => {
          setConversationEnded(true);
          setShowRating(true);
        }, 800);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          who: "assistant",
          text: "Sorry, something went wrong. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  function submitFromInput() {
    if (composerDisabled) return;
    const value = inputRef.current?.value.trim();
    if (!value) return;
    if (inputRef.current) {
      inputRef.current.value = "";
      autoResize(inputRef.current);
    }
    send(value);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    submitFromInput();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitFromInput();
    }
  }

  function resetConversation() {
    setTimeout(() => {
      setConversationId(null);
      setConversationEnded(false);
      setMessages([welcomeMessage()]);
    }, 1500);
  }

  function confirmEndChat() {
    setShowEndConfirm(false);
    if (conversationId) {
      setConversationEnded(true);
      setShowRating(true);
      return;
    }
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), who: "assistant", text: "Conversation ended.", createdAt: new Date().toISOString() },
    ]);
    resetConversation();
  }

  async function handleRating(rating: Rating, comment?: string) {
    if (!conversationId) return;

    try {
      await ragChatService.submitRating({ conversation_id: conversationId, rating, comment });
      setShowRating(false);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          who: "assistant",
          text: "Thank you for your feedback!",
          createdAt: new Date().toISOString(),
        },
      ]);
      resetConversation();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          who: "assistant",
          text: "Could not submit the rating. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }

  return (
    <div
      ref={panelRef}
      style={{ height: panelHeight }}
      className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-brand-50/80 via-white to-white px-5 py-4 dark:border-gray-800 dark:from-brand-500/10 dark:via-transparent dark:to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-md shadow-brand-500/30">
            <BotIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Parts Compatibility Chat
            </h3>
            <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
              </span>
              Online
            </p>
          </div>
        </div>

        {!conversationEnded && messages.length > 0 && !customerError && (
          <button
            type="button"
            onClick={() => setShowEndConfirm(true)}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <CloseIcon />
            End chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesRef}
        className="custom-scrollbar flex-1 space-y-4 overflow-y-auto bg-gray-50/50 p-5 dark:bg-white/[0.015]"
      >
        {customerLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <span className="relative flex h-10 w-10">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-40" />
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white">
                <BotIcon className="h-5 w-5" />
              </span>
            </span>
            <p className="text-sm text-gray-400">Starting chat session…</p>
          </div>
        )}

        {customerError && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <CloseIcon />
            </div>
            <p className="max-w-xs text-sm text-red-600 dark:text-red-400">{customerError}</p>
            <button
              type="button"
              onClick={() => setRetryTick((tick) => tick + 1)}
              className="rounded-full border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Try again
            </button>
          </div>
        )}

        {!customerLoading &&
          !customerError &&
          messages.map((message) => {
            const isUser = message.who === "user";
            return (
              <div
                key={message.id}
                className={cn("flex animate-message-in items-end gap-2.5", isUser && "flex-row-reverse")}
              >
                <Avatar who={message.who} userName={user?.name} />
                <div className={cn("flex max-w-[75%] flex-col", isUser ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "px-4 py-2.5",
                      isUser
                        ? "rounded-2xl rounded-br-md bg-gradient-to-br from-brand-500 to-brand-600 text-sm text-white shadow-md shadow-brand-500/20"
                        : "rounded-2xl rounded-bl-md border border-gray-100 bg-white text-gray-800 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white/90",
                    )}
                  >
                    {isUser ? message.text : renderAnswer(message.text)}
                  </div>
                  <span className="mt-1 px-1 text-[11px] text-gray-400 dark:text-gray-500">
                    {formatTime(message.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}

        {typing && <TypingBubble />}
        {showEndConfirm && <EndChatConfirm onConfirm={confirmEndChat} onCancel={() => setShowEndConfirm(false)} />}
        {showRating && <RatingForm onSubmit={handleRating} />}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.02]"
      >
        <div className="flex flex-1 items-end rounded-2xl border border-gray-200 bg-gray-50 px-4 py-1.5 transition-colors focus-within:border-brand-300 focus-within:ring-3 focus-within:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03]">
          <textarea
            ref={inputRef}
            rows={1}
            placeholder="Ask about parts compatibility…"
            disabled={composerDisabled}
            onKeyDown={handleKeyDown}
            onInput={(event) => autoResize(event.currentTarget)}
            className="max-h-32 min-h-9 w-full flex-1 resize-none bg-transparent py-1.5 text-sm text-gray-800 outline-hidden placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white/90"
          />
        </div>
        <button
          type="submit"
          disabled={composerDisabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30 transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {typing ? <SpinnerIcon /> : <SendIcon />}
        </button>
      </form>
    </div>
  );
}
