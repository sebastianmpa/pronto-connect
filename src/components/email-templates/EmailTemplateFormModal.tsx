import { useEffect, useRef, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import Select from "../form/Select";
import Switch from "../form/switch/Switch";
import emailTemplatesService from "../../lib/email-templates/emailTemplatesService";
import smsTemplatesService from "../../lib/sms-templates/smsTemplatesService";
import { EMAIL_TEMPLATE_TAGS } from "../../lib/email-templates/emailTemplateTags";
import type { EmailTemplateItem } from "../../lib/email-templates/types";
import EmailTemplatePreview from "./EmailTemplatePreview";

type TagTarget = "subject" | "htmlBody";

interface EmailTemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Present when editing an existing template; omitted when creating a new one. */
  template?: EmailTemplateItem | null;
  onSaved: () => void;
}

function insertTextAtSelection(
  currentValue: string,
  insertedValue: string,
  selectionStart?: number | null,
  selectionEnd?: number | null
) {
  const start = selectionStart ?? currentValue.length;
  const end = selectionEnd ?? start;

  return {
    value: `${currentValue.slice(0, start)}${insertedValue}${currentValue.slice(end)}`,
    caret: start + insertedValue.length,
  };
}

export default function EmailTemplateFormModal({
  isOpen,
  onClose,
  template,
  onSaved,
}: EmailTemplateFormModalProps) {
  const isEditing = !!template;

  const subjectRef = useRef<HTMLInputElement>(null);
  const htmlBodyRef = useRef<HTMLTextAreaElement>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);
  const subjectSelectionRef = useRef({ start: 0, end: 0 });
  const htmlBodySelectionRef = useRef({ start: 0, end: 0 });

  const [smsTemplateOptions, setSmsTemplateOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [smsTemplateId, setSmsTemplateId] = useState("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [active, setActive] = useState(true);
  const [tagTarget, setTagTarget] = useState<TagTarget>("htmlBody");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setSmsTemplateId(template?.sms_template_id ?? "");
    setName(template?.name ?? "");
    setSubject(template?.subject ?? "");
    setHtmlBody(template?.html_body ?? "");
    setActive(template ? template.active === "Y" : true);
    setTagTarget("htmlBody");
    setError(null);
  }, [isOpen, template]);

  useEffect(() => {
    if (!isOpen || isEditing) return;

    smsTemplatesService
      .getPaginated({ page: 1, limit: 100 })
      .then((res) => {
        setSmsTemplateOptions(
          (res.items ?? []).map((item) => ({
            value: item.id,
            label: `${item.id} — ${item.name}`,
          }))
        );
      })
      .catch(() => setSmsTemplateOptions([]));
  }, [isOpen, isEditing]);

  const rememberSubjectSelection = () => {
    const input = subjectRef.current;

    subjectSelectionRef.current = {
      start: input?.selectionStart ?? subject.length,
      end: input?.selectionEnd ?? input?.selectionStart ?? subject.length,
    };
    setTagTarget("subject");
  };

  const rememberHtmlBodySelection = () => {
    const textarea = htmlBodyRef.current;

    htmlBodySelectionRef.current = {
      start: textarea?.selectionStart ?? htmlBody.length,
      end: textarea?.selectionEnd ?? textarea?.selectionStart ?? htmlBody.length,
    };
    setTagTarget("htmlBody");
  };

  const restoreModalScroll = (scrollTop: number) => {
    requestAnimationFrame(() => {
      if (modalScrollRef.current) {
        modalScrollRef.current.scrollTop = scrollTop;
      }
    });
  };

  const handleInsertTag = (tag: string) => {
    const modalScrollTop = modalScrollRef.current?.scrollTop ?? 0;

    if (tagTarget === "subject") {
      const input = subjectRef.current;
      const selection = subjectSelectionRef.current;
      const result = insertTextAtSelection(
        subject,
        tag,
        selection.start,
        selection.end
      );

      setSubject(result.value);
      subjectSelectionRef.current = { start: result.caret, end: result.caret };

      requestAnimationFrame(() => {
        input?.focus({ preventScroll: true });
        input?.setSelectionRange(result.caret, result.caret);
        restoreModalScroll(modalScrollTop);
      });
      return;
    }

    const textarea = htmlBodyRef.current;
    const textareaScrollTop = textarea?.scrollTop ?? 0;
    const selection = htmlBodySelectionRef.current;
    const result = insertTextAtSelection(
      htmlBody,
      tag,
      selection.start,
      selection.end
    );

    setHtmlBody(result.value);
    htmlBodySelectionRef.current = { start: result.caret, end: result.caret };

    requestAnimationFrame(() => {
      textarea?.focus({ preventScroll: true });
      textarea?.setSelectionRange(result.caret, result.caret);

      if (textarea) {
        textarea.scrollTop = textareaScrollTop;
      }

      restoreModalScroll(modalScrollTop);
    });
  };

  const handleSave = async () => {
    if (!smsTemplateId || !name.trim() || !subject.trim() || !htmlBody.trim()) {
      setError("SMS template, name, subject and HTML body are all required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEditing && template) {
        await emailTemplatesService.update(template.id, {
          name,
          subject,
          html_body: htmlBody,
          active: active ? "Y" : "N",
        });
      } else {
        await emailTemplatesService.create({
          sms_template_id: smsTemplateId,
          name,
          subject,
          html_body: htmlBody,
          active: active ? "Y" : "N",
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
      className="relative w-full max-w-[1240px] rounded-3xl bg-white p-6 sm:m-0 lg:p-8 dark:bg-gray-900"
    >
      <div>
        <h4 className="mb-1 pr-14 text-title-sm font-semibold text-gray-800 dark:text-white/90">
          {isEditing ? `Edit Email Template — #${template?.id}` : "New Email Template"}
        </h4>
        <p className="mb-6 max-w-4xl text-sm leading-6 text-gray-500 dark:text-gray-400">
          Select the subject or HTML body and click a tag to insert it at the cursor position.
          The preview updates automatically while you edit the email.
        </p>

        <div ref={modalScrollRef} className="max-h-[74vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label>Linked SMS Template</Label>
                {isEditing ? (
                  <div className="flex h-11 items-center rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                    {template?.sms_template_id}
                  </div>
                ) : (
                  <Select
                    options={smsTemplateOptions}
                    defaultValue={smsTemplateId}
                    onChange={setSmsTemplateId}
                    placeholder="Select an SMS template"
                  />
                )}
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
                <Label>Subject</Label>
                <Input
                  ref={subjectRef}
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  onFocus={rememberSubjectSelection}
                  onSelect={rememberSubjectSelection}
                  placeholder="Order {{order_number}} confirmed"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <Label className="mb-0">HTML body</Label>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Tags insert into {tagTarget === "subject" ? "Subject" : "HTML body"}
                  </span>
                </div>
                <TextArea
                  ref={htmlBodyRef}
                  rows={18}
                  value={htmlBody}
                  onChange={setHtmlBody}
                  onFocus={rememberHtmlBodySelection}
                  onSelect={rememberHtmlBodySelection}
                  placeholder="<!DOCTYPE html><html>...</html>"
                  className="min-h-[430px] resize-y font-mono text-xs leading-5"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Available tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {EMAIL_TEMPLATE_TAGS.map((tag) => (
                    <button
                      key={tag.value}
                      type="button"
                      title={`${tag.description} Inserts ${tag.value}`}
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

            <div className="xl:sticky xl:top-0 xl:self-start">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Live preview
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    HTML is sanitized and rendered inside an isolated frame.
                  </p>
                </div>
              </div>
              <EmailTemplatePreview html={htmlBody} subject={subject} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex w-full flex-col items-center justify-between gap-3 border-t border-gray-100 pt-5 sm:flex-row dark:border-gray-800">
          <Button variant="outline" className="w-full sm:w-auto" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button className="w-full sm:w-auto" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isEditing ? "Save changes" : "Create template"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}