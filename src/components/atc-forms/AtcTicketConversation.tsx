import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import atcFormsService from "../../lib/atc-forms/atcFormsService";
import type { AtcFormTicketResponse, AtcFormTicketThread } from "../../lib/atc-forms/types";
import { formatDateTime } from "../../utils/date";

interface Props {
  requestId: number;
  ticketNumber: string | null;
  onStatusChanged: (status: string) => void;
}

function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
}

function isImageName(name: string): boolean {
  return /\.(png|jpe?g|gif|webp)$/i.test(name);
}

function TicketAttachment({
  formId, threadId, attachment,
}: {
  formId: number;
  threadId: string | null;
  attachment: AtcFormTicketThread["attachments"][number];
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const isImage = isImageName(attachment.name);

  useEffect(() => {
    if (!isImage) return;
    let active = true;
    let objectUrl: string | null = null;
    atcFormsService.getTicketAttachment(formId, threadId, attachment.id)
      .then((blob) => {
        if (!active) return;
        if (!blob.type.startsWith("image/")) {
          setPreviewError(true);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      })
      .catch(() => { if (active) setPreviewError(true); });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [formId, threadId, attachment.id, isImage]);

  const download = async () => {
    setDownloading(true);
    setPreviewError(false);
    try {
      const blob = await atcFormsService.getTicketAttachment(formId, threadId, attachment.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setPreviewError(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
      {imageUrl && (
        <a href={imageUrl} target="_blank" rel="noreferrer" aria-label={`Open ${attachment.name}`}>
          <img src={imageUrl} alt={attachment.name} className="mb-2 max-h-44 w-full rounded-lg object-contain" />
        </a>
      )}
      {isImage && !imageUrl && !previewError && <div className="mb-2 h-28 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />}
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs text-gray-600 dark:text-gray-300" title={attachment.name}>{attachment.name}</span>
        <button type="button" onClick={() => void download()} disabled={downloading}
          className="shrink-0 text-xs font-semibold text-brand-600 disabled:opacity-50 dark:text-brand-400">
          {downloading ? "Loading…" : "Download"}
        </button>
      </div>
      {previewError && <p className="mt-1 text-xs text-error-600">Preview unavailable.</p>}
    </div>
  );
}

function TicketMessage({ thread, requestId }: { thread: AtcFormTicketThread; requestId: number }) {
  const [expanded, setExpanded] = useState(false);
  const isAgent = thread.direction?.toLowerCase() === "out";
  const isHtml = /<\s*\/?(?:div|p|br|span|strong|b|table|blockquote|ul|ol|li)\b/i.test(thread.content)
    || ["html", "text/html"].includes(thread.contentType.toLowerCase());
  const safeHtml = useMemo(() => DOMPurify.sanitize(thread.content, {
    ALLOWED_TAGS: ["p", "div", "br", "strong", "b", "em", "i", "u", "a", "ul", "ol", "li", "blockquote"],
    ALLOWED_ATTR: ["href"],
  }), [thread.content]);
  const canCollapse = thread.content.length > 650;

  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${isAgent
      ? "border-brand-100 bg-white dark:border-brand-500/20 dark:bg-gray-900"
      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"}`}>
      <div className="mb-3 flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isAgent
          ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
          : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"}`}>
          {isAgent ? "A" : "C"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{thread.isPrivate ? "Private note" : isAgent ? "Agent" : "Customer"}</span>
            {thread.status && thread.status.toUpperCase() !== "SUCCESS" && (
              <span className="rounded-full bg-warning-50 px-2 py-0.5 text-xs text-warning-700">{thread.status}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-2 text-xs text-gray-500 dark:text-gray-400">
            {thread.from && <span className="break-all">{thread.from}</span>}
            {thread.sentAt && <time>{formatDateTime(thread.sentAt)}</time>}
          </div>
        </div>
      </div>
      <div className={`relative ${canCollapse && !expanded ? "max-h-44 overflow-hidden" : ""}`}>
        {isHtml ? (
          <div className="space-y-2 break-words text-sm leading-6 text-gray-700 [&_a]:text-brand-600 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: safeHtml }} />
        ) : (
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700 dark:text-gray-300">{thread.content || "No message text."}</p>
        )}
        {canCollapse && !expanded && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white dark:from-gray-900" />}
      </div>
      {canCollapse && (
        <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-2 text-xs font-semibold text-brand-600 dark:text-brand-400">
          {expanded ? "Show less" : "Read full message"}
        </button>
      )}
      {thread.attachments.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Attachments · {thread.attachments.length}</p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {thread.attachments.map((attachment) => (
              <li key={attachment.id}>
                <TicketAttachment formId={requestId} threadId={thread.id} attachment={attachment} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export default function AtcTicketConversation({ requestId, ticketNumber, onStatusChanged }: Props) {
  const [ticket, setTicket] = useState<AtcFormTicketResponse["ticket"] | null>(null);
  const [threads, setThreads] = useState<AtcFormTicketThread[]>([]);
  const [files, setFiles] = useState<AtcFormTicketThread["attachments"]>([]);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!ticketNumber) return;
    let active = true;
    setLoading(true);
    setError(null);
    atcFormsService.getTicket(requestId)
      .then((response) => {
        if (!active) return;
        setTicket(response.ticket);
        setThreads(response.threads.items);
        setFiles(response.attachments);
        setHasMore(response.threads.hasMore);
      })
      .catch((loadError) => { if (active) setError(errorMessage(loadError, "Could not load the ticket conversation.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [requestId, ticketNumber, refresh]);

  const closed = ["closed", "resolved"].includes((ticket?.statusType || ticket?.status || "").toLowerCase());

  const loadMore = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await atcFormsService.getTicket(requestId, threads.length);
      setThreads((current) => [...current, ...response.threads.items]);
      setHasMore(response.threads.hasMore);
    } catch (loadError) {
      setError(errorMessage(loadError, "Could not load older messages."));
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await atcFormsService.replyToTicket(requestId, reply.trim());
      onStatusChanged(result.atcFormStatus);
      setReply("");
      setNotice(result.statusUpdateFailed
        ? "Reply sent. The request status could not be updated; update it manually."
        : "Reply sent to the customer.");
      setRefresh((value) => value + 1);
    } catch (replyError) {
      setError(errorMessage(replyError, "Could not send the reply."));
    } finally {
      setBusy(false);
    }
  };

  const closeTicket = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await atcFormsService.closeTicket(requestId);
      onStatusChanged(result.atcFormStatus);
      setTicket((current) => current ? { ...current, status: result.status, statusType: result.statusType } : current);
      setNotice(result.statusUpdateFailed
        ? "Ticket closed. The request status could not be updated; update it manually."
        : "Ticket closed.");
    } catch (closeError) {
      setError(errorMessage(closeError, "Could not close the ticket."));
    } finally {
      setBusy(false);
    }
  };

  const reopenTicket = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await atcFormsService.reopenTicket(requestId);
      onStatusChanged(result.atcFormStatus);
      setTicket((current) => current ? { ...current, status: result.status, statusType: result.statusType } : current);
      setNotice(result.statusUpdateFailed
        ? "Ticket reopened. The request status could not be updated; update it manually."
        : "Ticket reopened. You can reply to the customer now.");
    } catch (reopenError) {
      setError(errorMessage(reopenError, "Could not reopen the ticket."));
    } finally {
      setBusy(false);
    }
  };

  if (!ticketNumber) {
    return <section className="order-1 flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-gray-700 lg:order-2">This request has no linked Zoho ticket.</section>;
  }

  return (
    <section className="order-1 flex min-h-[480px] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 lg:order-2 lg:h-full lg:min-h-0">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Zoho ticket #{ticketNumber}</p>
          <h5 className="mt-1 truncate text-base font-semibold text-gray-800 dark:text-white/90">{ticket?.subject || "Conversation"}</h5>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${closed ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" : "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"}`}>
            {ticket?.status || (loading ? "Loading…" : "Unavailable")}
          </span>
          {ticket && (
            <button type="button" onClick={() => void (closed ? reopenTicket() : closeTicket())} disabled={busy} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
              {busy ? "Saving…" : closed ? "Reopen ticket" : "Close ticket"}
            </button>
          )}
        </div>
      </header>

      {files.length > 0 && (
        <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ticket files · {files.length}</p>
            {files.length > 6 && (
              <button type="button" onClick={() => setShowAllFiles((value) => !value)} className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                {showAllFiles ? "Show fewer" : "Show all files"}
              </button>
            )}
          </div>
          <ul className="flex max-h-56 gap-2 overflow-x-auto pb-1">
            {(showAllFiles ? files : files.slice(0, 6)).map((attachment) => (
              <li key={attachment.id} className="w-44 shrink-0">
                <TicketAttachment formId={requestId} threadId={null} attachment={attachment} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-gray-50/70 px-4 py-5 dark:bg-gray-950/30" aria-label="Ticket conversation">
        {loading && threads.length === 0 && <p className="text-sm text-gray-500">Loading conversation…</p>}
        {!loading && threads.length === 0 && !error && <p className="text-sm text-gray-500">No messages in this ticket yet.</p>}
        {threads.map((thread) => <TicketMessage key={thread.id} thread={thread} requestId={requestId} />)}
        {hasMore && <button type="button" onClick={() => void loadMore()} disabled={loading} className="w-full rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-brand-600 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900">{loading ? "Loading…" : "Load older messages"}</button>}
      </div>

      {(error || notice) && <p role={error ? "alert" : "status"} className={`border-t px-5 py-2 text-sm ${error ? "text-error-600" : "text-success-700"}`}>{error || notice}</p>}
      {ticket && !closed && (
        <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <label htmlFor="atc-ticket-reply" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">Reply to customer by email</label>
          <textarea id="atc-ticket-reply" value={reply} onChange={(event) => setReply(event.target.value)} maxLength={20000} rows={3} placeholder="Write your reply…"
            className="w-full resize-y rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-800 focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={() => void sendReply()} disabled={busy || !reply.trim()} className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-gray-900 disabled:opacity-50">
              {busy ? "Sending…" : "Send reply"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
