import { useEffect, useRef, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import customerMessagesDictionaryService from "../../lib/customer-messages-dictionary/customerMessagesDictionaryService";
import { SMS_TEMPLATE_TAGS } from "../../lib/sms-templates/smsTemplateTags";
import type { CustomerMessageDictionaryItem } from "../../lib/customer-messages-dictionary/types";

interface CustomerMessageDictionaryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Present when editing an existing entry; omitted when creating a new one. */
  entry?: CustomerMessageDictionaryItem | null;
  onSaved: () => void;
}

interface SelectionRange {
  start: number;
  end: number;
}

interface ScrollPosition {
  element: HTMLElement;
  top: number;
  left: number;
}

function insertTextAtSelection(
  currentValue: string,
  insertedValue: string,
  selection: SelectionRange
) {
  const start = Math.min(selection.start, currentValue.length);
  const end = Math.min(Math.max(selection.end, start), currentValue.length);

  return {
    value: `${currentValue.slice(0, start)}${insertedValue}${currentValue.slice(end)}`,
    caret: start + insertedValue.length,
  };
}

function captureScrollableParents(element: HTMLElement | null): ScrollPosition[] {
  const positions: ScrollPosition[] = [];
  let parent = element?.parentElement ?? null;

  while (parent) {
    const styles = window.getComputedStyle(parent);
    const canScrollY = /(auto|scroll|overlay)/.test(styles.overflowY);
    const canScrollX = /(auto|scroll|overlay)/.test(styles.overflowX);

    if (canScrollY || canScrollX) {
      positions.push({ element: parent, top: parent.scrollTop, left: parent.scrollLeft });
    }

    parent = parent.parentElement;
  }

  return positions;
}

/**
 * A message textarea + its own "insert variable" button row. Each field
 * (customer message, dial plan message) tracks its own cursor position so
 * inserting a variable never clobbers the other field's edits.
 */
function VariableMessageField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef<SelectionRange>({ start: value.length, end: value.length });

  const rememberSelection = () => {
    const textarea = textareaRef.current;
    selectionRef.current = {
      start: textarea?.selectionStart ?? value.length,
      end: textarea?.selectionEnd ?? textarea?.selectionStart ?? value.length,
    };
  };

  const handleInsertTag = (tag: string) => {
    const textarea = textareaRef.current;
    const textareaScrollTop = textarea?.scrollTop ?? 0;
    const textareaScrollLeft = textarea?.scrollLeft ?? 0;
    const windowScrollX = window.scrollX;
    const windowScrollY = window.scrollY;
    const parentScrollPositions = captureScrollableParents(textarea);
    const liveSelection: SelectionRange = {
      start: textarea?.selectionStart ?? selectionRef.current.start,
      end: textarea?.selectionEnd ?? selectionRef.current.end,
    };
    const result = insertTextAtSelection(value, tag, liveSelection);

    onChange(result.value);
    selectionRef.current = { start: result.caret, end: result.caret };

    requestAnimationFrame(() => {
      textarea?.focus({ preventScroll: true });
      textarea?.setSelectionRange(result.caret, result.caret);

      if (textarea) {
        textarea.scrollTop = textareaScrollTop;
        textarea.scrollLeft = textareaScrollLeft;
      }

      parentScrollPositions.forEach(({ element, top, left }) => {
        element.scrollTop = top;
        element.scrollLeft = left;
      });

      window.scrollTo(windowScrollX, windowScrollY);
    });
  };

  return (
    <div>
      <Label>{label}</Label>
      <TextArea
        ref={textareaRef}
        rows={4}
        value={value}
        onChange={onChange}
        onFocus={rememberSelection}
        onSelect={rememberSelection}
        placeholder={placeholder}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {SMS_TEMPLATE_TAGS.map((tag) => (
          <button
            key={tag.value}
            type="button"
            title={`${tag.description}. Inserts ${tag.value}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => handleInsertTag(tag.value)}
            className="group inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-left text-xs font-medium text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-100 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
          >
            <span>{tag.label}</span>
            <code className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] text-brand-600 group-hover:bg-white dark:bg-white/10 dark:text-brand-300">
              {tag.value}
            </code>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CustomerMessageDictionaryFormModal({
  isOpen,
  onClose,
  entry,
  onSaved,
}: CustomerMessageDictionaryFormModalProps) {
  const isEditing = !!entry;

  const [displayName, setDisplayName] = useState("");
  const [internalName, setInternalName] = useState("");
  const [step, setStep] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [description, setDescription] = useState("");
  const [customerMessage, setCustomerMessage] = useState("");
  const [dialPlanMessage, setDialPlanMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDisplayName(entry?.order_status_display_name ?? "");
    setInternalName(entry?.order_status_internal_name ?? "");
    setStep(entry ? String(entry.step ?? "") : "");
    setSmsCode(entry?.sms_code ?? "");
    setDescription(entry?.description ?? "");
    setCustomerMessage(entry?.customer_message ?? "");
    setDialPlanMessage(entry?.dial_plan_message ?? "");
    setError(null);
  }, [isOpen, entry]);

  const handleSave = async () => {
    const stepNumber = Number(step);

    if (!displayName.trim() || !internalName.trim() || !customerMessage.trim() || !step.trim()) {
      setError("Display name, internal name, step and customer message are all required.");
      return;
    }

    if (!Number.isFinite(stepNumber)) {
      setError("Step must be a number.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      order_status_display_name: displayName.trim(),
      order_status_internal_name: internalName.trim(),
      customer_message: customerMessage,
      dial_plan_message: dialPlanMessage,
      step: stepNumber,
      description,
      sms_code: smsCode,
    };

    try {
      if (isEditing && entry) {
        await customerMessagesDictionaryService.update(entry.id, payload);
      } else {
        await customerMessagesDictionaryService.create(payload);
      }

      onSaved();
      onClose();
    } catch {
      setError("Could not save the status dictionary entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="relative w-full max-w-[700px] sm:m-0 rounded-3xl bg-white p-6 lg:p-10 dark:bg-gray-900"
    >
      <div>
        <h4 className="mb-1 pr-12 text-title-sm font-semibold text-gray-800 dark:text-white/90">
          {isEditing ? `Edit Status — ${entry?.order_status_display_name}` : "New Status"}
        </h4>
        <p className="mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Click an available variable to insert it at the current cursor position inside a
          message field.
        </p>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Display name</Label>
              <Input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="ORDER RECEIVED"
              />
            </div>
            <div>
              <Label>Internal name</Label>
              <Input
                type="text"
                value={internalName}
                onChange={(event) => setInternalName(event.target.value)}
                placeholder="order_received"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Step</Label>
              <Input
                type="number"
                value={step}
                onChange={(event) => setStep(event.target.value)}
                placeholder="1"
              />
            </div>
            <div>
              <Label>SMS code</Label>
              <Input
                type="text"
                value={smsCode}
                onChange={(event) => setSmsCode(event.target.value)}
                placeholder="SMS_1"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <TextArea
              rows={2}
              value={description}
              onChange={setDescription}
              placeholder="Internal notes about when this status applies"
            />
          </div>

          <VariableMessageField
            label="Customer message"
            value={customerMessage}
            onChange={setCustomerMessage}
            placeholder="Your order {{order_number}} is being processed..."
          />

          <VariableMessageField
            label="Dial plan message"
            value={dialPlanMessage}
            onChange={setDialPlanMessage}
            placeholder="Order Status: Processing. Your order {{order_number}} is..."
          />

          {error && (
            <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 flex w-full flex-col items-center justify-between gap-3 sm:flex-row">
          <Button variant="outline" className="w-full" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isEditing ? "Save changes" : "Create status"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
