import { useEffect, useMemo, useState } from "react";
import ordersService from "../../lib/orders/ordersService";
import type {
  OrderBigCommerceInfo,
  OrderIdealInfo,
} from "../../lib/orders/types";

interface OrderNotesPanelProps {
  orderNumber: string;
  ideal?: OrderIdealInfo | null;
  bigcommerce?: OrderBigCommerceInfo | null;
}

interface ExpandableNoteProps {
  text: string;
  emptyText: string;
  previewLength?: number;
}

const IDEAL_NOTES_MAX_LENGTH = 80;
const IDEAL_NOTE_SEPARATOR = " | ";
const NOTE_PREVIEW_LENGTH = 95;

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function getApiErrorMessage(error: unknown): string {
  const response = (
    error as {
      response?: {
        status?: number;
        data?: {
          message?: unknown;
          error?: unknown;
          detail?: unknown;
        };
      };
    }
  )?.response;

  const apiMessage = cleanText(
    response?.data?.message ?? response?.data?.error ?? response?.data?.detail,
  );

  if (apiMessage) return apiMessage;

  if (response?.status === 422) {
    return "The complete IDEAL note cannot exceed 80 characters.";
  }

  if (response?.status === 403) {
    return "You do not have permission to update order notes.";
  }

  if (response?.status === 401) {
    return "Your session is no longer authorized. Please sign in again.";
  }

  return "Could not add the note. Please try again.";
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExpandableNote({
  text,
  emptyText,
  previewLength = NOTE_PREVIEW_LENGTH,
}: ExpandableNoteProps) {
  const [expanded, setExpanded] = useState(false);
  const clean = cleanText(text);
  const isLong = clean.length > previewLength;

  useEffect(() => {
    setExpanded(false);
  }, [clean]);

  if (!clean) {
    return (
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {emptyText}
      </p>
    );
  }

  const visibleText =
    isLong && !expanded
      ? `${clean.slice(0, previewLength).trimEnd()}...`
      : clean;

  return (
    <div className="mt-2">
      <p className="whitespace-pre-wrap break-words text-sm leading-5 text-gray-700 dark:text-gray-300">
        {visibleText}
      </p>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium text-brand-500 transition hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-brand-400 dark:hover:text-brand-300"
          title={expanded ? "Show less" : "Show more"}
          aria-expanded={expanded}
        >
          <ChevronIcon expanded={expanded} />
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export default function OrderNotesPanel({
  orderNumber,
  ideal,
  bigcommerce,
}: OrderNotesPanelProps) {
  const [idealState, setIdealState] = useState<OrderIdealInfo | null>(ideal ?? null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setIdealState(ideal ?? null);
  }, [ideal]);

  const currentIdealNotes = cleanText(idealState?.notes);
  const customerNote = cleanText(bigcommerce?.customer_note);
  const trimmedDraft = draft.trim();

  const remainingCharacters = useMemo(() => {
    const separatorLength = currentIdealNotes ? IDEAL_NOTE_SEPARATOR.length : 0;
    return Math.max(
      0,
      IDEAL_NOTES_MAX_LENGTH - currentIdealNotes.length - separatorLength,
    );
  }, [currentIdealNotes]);

  const projectedLength = useMemo(() => {
    if (!trimmedDraft) return currentIdealNotes.length;
    return (
      currentIdealNotes.length +
      (currentIdealNotes ? IDEAL_NOTE_SEPARATOR.length : 0) +
      trimmedDraft.length
    );
  }, [currentIdealNotes, trimmedDraft]);

  const canAddNote =
    Boolean(idealState?.order_id) &&
    Boolean(trimmedDraft) &&
    projectedLength <= IDEAL_NOTES_MAX_LENGTH &&
    !saving;

  const handleAddNote = async () => {
    if (!canAddNote) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await ordersService.addOrderNote(orderNumber, trimmedDraft);

      const updatedIdeal = response.ideal;

      if (updatedIdeal) {
        setIdealState(updatedIdeal);
      } else {
        setIdealState((previous) => ({
          order_id: previous?.order_id ?? null,
          notes: currentIdealNotes
            ? `${currentIdealNotes}${IDEAL_NOTE_SEPARATOR}${trimmedDraft}`
            : trimmedDraft,
          is_hold: previous?.is_hold ?? false,
          hold_reason: previous?.hold_reason ?? null,
        }));
      }

      setDraft("");
      setSuccess("Note added to IDEAL successfully.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-white/[0.06] dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
            Order Notes
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            IDEAL notes, On Hold status and BigCommerce customer note.
          </p>
        </div>

        {idealState && (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              idealState.is_hold
                ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                : "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
            }`}
          >
            {idealState.is_hold ? "ON HOLD" : "NOT ON HOLD"}
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              IDEAL Notes
            </p>
            {idealState?.order_id !== null && idealState?.order_id !== undefined && (
              <span className="text-[11px] text-gray-400">
                ID {idealState.order_id}
              </span>
            )}
          </div>

          <ExpandableNote
            text={currentIdealNotes}
            emptyText="No IDEAL notes."
            previewLength={NOTE_PREVIEW_LENGTH}
          />

          {idealState?.is_hold && idealState.hold_reason && (
            <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-400">
              <span className="font-semibold">Hold reason:</span>{" "}
              {idealState.hold_reason}
            </p>
          )}
        </div>

        <div className="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            BigCommerce Customer Note
          </p>

          <ExpandableNote
            text={customerNote}
            emptyText="No customer note."
            previewLength={NOTE_PREVIEW_LENGTH}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label
              htmlFor={`order-note-${orderNumber}`}
              className="text-xs font-medium text-gray-600 dark:text-gray-400"
            >
              Add note to IDEAL
            </label>
            <span
              className={`text-[11px] ${
                projectedLength > IDEAL_NOTES_MAX_LENGTH
                  ? "text-red-500"
                  : "text-gray-400"
              }`}
            >
              {projectedLength}/{IDEAL_NOTES_MAX_LENGTH}
            </span>
          </div>

          <textarea
            id={`order-note-${orderNumber}`}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
              setSuccess(null);
            }}
            maxLength={remainingCharacters}
            rows={3}
            disabled={!idealState?.order_id || saving || remainingCharacters <= 0}
            placeholder={
              !idealState?.order_id
                ? "IDEAL order is not available."
                : remainingCharacters <= 0
                  ? "The IDEAL note is already at the 80 character limit."
                  : "Write a note to append in IDEAL..."
            }
            className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 dark:border-white/[0.10] dark:bg-gray-900 dark:text-gray-300 dark:disabled:bg-white/[0.03]"
          />

          <div className="mt-1 flex items-start justify-between gap-3">
            <p className="text-[11px] leading-4 text-gray-400">
              IDEAL stores a maximum of 80 characters. The new text is appended using
              {` "${IDEAL_NOTE_SEPARATOR.trim()}" `}
              as separator.
            </p>
            <span className="shrink-0 text-[11px] text-gray-400">
              {remainingCharacters} available
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700 dark:bg-green-500/10 dark:text-green-400">
            {success}
          </div>
        )}

        <button
          type="button"
          onClick={handleAddNote}
          disabled={!canAddNote}
          className="inline-flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Adding note..." : "Add note"}
        </button>
      </div>
    </div>
  );
}
