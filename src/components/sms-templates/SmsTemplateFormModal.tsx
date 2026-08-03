import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import Switch from "../form/switch/Switch";
import smsTemplatesService from "../../lib/sms-templates/smsTemplatesService";
import type { SmsTemplateItem } from "../../lib/sms-templates/types";

interface SmsTemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Present when editing an existing template; omitted when creating a new one. */
  template?: SmsTemplateItem | null;
  onSaved: () => void;
}

export default function SmsTemplateFormModal({
  isOpen,
  onClose,
  template,
  onSaved,
}: SmsTemplateFormModalProps) {
  const isEditing = !!template;

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setId(template?.id ?? "");
    setName(template?.name ?? "");
    setMessageBody(template?.message_body ?? "");
    setActive(template ? template.active === "yes" : true);
    setError(null);
  }, [isOpen, template]);

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
        <h4 className="text-title-sm mb-1 font-semibold text-gray-800 dark:text-white/90">
          {isEditing ? `Edit Template — ${template?.id}` : "New SMS Template"}
        </h4>
        <p className="mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Use <code>{"{{variable}}"}</code> placeholders (e.g. <code>{"{{customer_first_name}}"}</code>, <code>{"{{order_number}}"}</code>) inside the message body.
        </p>

        <div className="space-y-4">
          <div>
            <Label>Template ID</Label>
            <Input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              disabled={isEditing}
              placeholder="SMS_MY_TEMPLATE"
            />
          </div>
          <div>
            <Label>Name</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name"
            />
          </div>
          <div>
            <Label>Message body</Label>
            <TextArea
              rows={5}
              value={messageBody}
              onChange={setMessageBody}
              placeholder="Hi {{customer_first_name}}, your order {{order_number}} is confirmed."
            />
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
