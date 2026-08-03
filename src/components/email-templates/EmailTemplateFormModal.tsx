import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import Select from "../form/Select";
import Switch from "../form/switch/Switch";
import emailTemplatesService from "../../lib/email-templates/emailTemplatesService";
import smsTemplatesService from "../../lib/sms-templates/smsTemplatesService";
import type { EmailTemplateItem } from "../../lib/email-templates/types";

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}

interface EmailTemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Present when editing an existing template; omitted when creating a new one. */
  template?: EmailTemplateItem | null;
  onSaved: () => void;
}

export default function EmailTemplateFormModal({
  isOpen,
  onClose,
  template,
  onSaved,
}: EmailTemplateFormModalProps) {
  const isEditing = !!template;

  const [smsTemplateOptions, setSmsTemplateOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [smsTemplateId, setSmsTemplateId] = useState("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [active, setActive] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSmsTemplateId(template?.sms_template_id ?? "");
    setName(template?.name ?? "");
    setSubject(template?.subject ?? "");
    setHtmlBody(template?.html_body ?? "");
    setActive(template ? template.active === "Y" : true);
    setShowPreview(false);
    setError(null);
  }, [isOpen, template]);

  useEffect(() => {
    if (!isOpen || isEditing) return;
    smsTemplatesService
      .getPaginated({ page: 1, limit: 100 })
      .then((res) => {
        setSmsTemplateOptions(
          (res.items ?? []).map((t) => ({ value: t.id, label: `${t.id} — ${t.name}` }))
        );
      })
      .catch(() => setSmsTemplateOptions([]));
  }, [isOpen, isEditing]);

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
      className="relative w-full max-w-[700px] sm:m-0 rounded-3xl bg-white p-6 lg:p-10 dark:bg-gray-900"
    >
      <div>
        <h4 className="text-title-sm mb-1 font-semibold text-gray-800 dark:text-white/90">
          {isEditing ? `Edit Email Template — #${template?.id}` : "New Email Template"}
        </h4>
        <p className="mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Linked to an SMS template. Use <code>{"{{variable}}"}</code> placeholders (e.g. <code>{"{{customer_first_name}}"}</code>, <code>{"{{order_number}}"}</code>) inside the subject and body.
        </p>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
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
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" />
          </div>
          <div>
            <Label>Subject</Label>
            <Input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Order {{order_number}} confirmed"
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="mb-0">HTML body</Label>
              <button
                type="button"
                onClick={() => setShowPreview((p) => !p)}
                className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                {showPreview ? "Edit HTML" : "Preview"}
              </button>
            </div>
            {showPreview ? (
              <div
                className="max-h-64 overflow-y-auto rounded-lg border border-gray-300 bg-white p-4 text-sm dark:border-gray-700 dark:bg-gray-900"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlBody) }}
              />
            ) : (
              <TextArea
                rows={8}
                value={htmlBody}
                onChange={setHtmlBody}
                placeholder="<html>...</html>"
                className="font-mono text-xs"
              />
            )}
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

        <div className="mt-8 flex flex-col sm:flex-row w-full items-center justify-between gap-3">
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
