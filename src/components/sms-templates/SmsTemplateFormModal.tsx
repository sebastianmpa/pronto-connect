import { useEffect, useRef, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import Switch from "../form/switch/Switch";
import smsTemplatesService from "../../lib/sms-templates/smsTemplatesService";
import { SMS_TEMPLATE_TAGS } from "../../lib/sms-templates/smsTemplateTags";
import type { SmsTemplateItem } from "../../lib/sms-templates/types";

interface SmsTemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Present when editing an existing template; omitted when creating a new one. */
  template?: SmsTemplateItem | null;
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
      positions.push({
        element: parent,
        top: parent.scrollTop,
        left: parent.scrollLeft,
      });
    }

    parent = parent.parentElement;
  }

  return positions;
}

export default function SmsTemplateFormModal({
  isOpen,
  onClose,
  template,
  onSaved,
}: SmsTemplateFormModalProps) {
  const isEditing = !!template;
  const messageBodyRef = useRef<HTMLTextAreaElement>(null);
  const messageSelectionRef = useRef<SelectionRange>({ start: 0, end: 0 });

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const initialMessageBody = template?.message_body ?? "";

    setId(template?.id ?? "");
    setName(template?.name ?? "");
    setMessageBody(initialMessageBody);
    setActive(template ? template.active === "yes" : true);
    setError(null);
    messageSelectionRef.current = {
      start: initialMessageBody.length,
      end: initialMessageBody.length,
    };
  }, [isOpen, template]);

  const rememberMessageSelection = () => {
    const textarea = messageBodyRef.current;

    messageSelectionRef.current = {
      start: textarea?.selectionStart ?? messageBody.length,
      end: textarea?.selectionEnd ?? textarea?.selectionStart ?? messageBody.length,
    };
  };

  const handleInsertTag = (tag: string) => {
    const textarea = messageBodyRef.current;
    const textareaScrollTop = textarea?.scrollTop ?? 0;
    const textareaScrollLeft = textarea?.scrollLeft ?? 0;
    const windowScrollX = window.scrollX;
    const windowScrollY = window.scrollY;
    const parentScrollPositions = captureScrollableParents(textarea);
    const liveSelection: SelectionRange = {
      start: textarea?.selectionStart ?? messageSelectionRef.current.start,
      end: textarea?.selectionEnd ?? messageSelectionRef.current.end,
    };
    const result = insertTextAtSelection(messageBody, tag, liveSelection);

    setMessageBody(result.value);
    messageSelectionRef.current = {
      start: result.caret,
      end: result.caret,
    };

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

  const handleSave = async () => {
    if (!id.trim() || !name.trim() || !messageBody.trim()) {
      setError("ID, name and message body are all required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEditing) {
        await smsTemplatesService.update(id, {
          name,
          message_body: messageBody,
          active: active ? "yes" : "no",
        });
      } else {
        await smsTemplatesService.create({
          id,
          name,
          message_body: messageBody,
          active: active ? "yes" : "no",
        });
      }

      onSaved();
      onClose();
    } catch {
      setError("Could not save the template. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="relative w-full max-w-[600px] sm:m-0 rounded-3xl bg-white p-6 lg:p-10 dark:bg-gray-900"
    >
      <div>
        <h4 className="mb-1 pr-12 text-title-sm font-semibold text-gray-800 dark:text-white/90">
          {isEditing ? `Edit Template — ${template?.id}` : "New SMS Template"}
        </h4>
        <p className="mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Click an available variable to insert it at the current cursor position inside the
          message body.
        </p>

        <div className="space-y-4">
          <div>
            <Label>Template ID</Label>
            <Input
              type="text"
              value={id}
              onChange={(event) => setId(event.target.value)}
              disabled={isEditing}
              placeholder="SMS_MY_TEMPLATE"
            />
          </div>

          <div>
            <Label>Name</Label>
            <Input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Template name"
            />
          </div>

          <div>
            <Label>Message body</Label>
            <TextArea
              ref={messageBodyRef}
              rows={5}
              value={messageBody}
              onChange={setMessageBody}
              onFocus={rememberMessageSelection}
              onSelect={rememberMessageSelection}
              placeholder="Hi {{customer_first_name}}, your order {{order_number}} is confirmed."
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Available variables
            </p>
            <div className="flex flex-wrap gap-2">
              {SMS_TEMPLATE_TAGS.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  title={`${tag.description}. Inserts ${tag.value}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleInsertTag(tag.value)}
                  className="group inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-left text-xs font-medium text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-100 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
                >
                  <span>{tag.label}</span>
                  <code className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] text-brand-600 group-hover:bg-white dark:bg-white/10 dark:text-brand-300">
                    {tag.value}
                  </code>
                </button>
              ))}
            </div>
          </div>

          <Switch
            key={`${template?.id ?? "new"}-${isOpen}`}
            label="Active"
            defaultChecked={active}
            onChange={setActive}
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
            {saving ? "Saving…" : isEditing ? "Save changes" : "Create template"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}