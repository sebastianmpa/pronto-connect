import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import closureMethodsService from "../../lib/closure-methods/closureMethodsService";
import type { ClosureMethodItem } from "../../lib/closure-methods/types";

interface ClosureMethodFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Present when editing an existing method; omitted when creating a new one. */
  method?: ClosureMethodItem | null;
  onSaved: () => void;
}

export default function ClosureMethodFormModal({
  isOpen,
  onClose,
  method,
  onSaved,
}: ClosureMethodFormModalProps) {
  const isEditing = !!method;

  const [methodName, setMethodName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMethodName(method?.methodName ?? "");
    setDescription(method?.description ?? "");
    setError(null);
  }, [isOpen, method]);

  const handleSave = async () => {
    if (!methodName.trim() || !description.trim()) {
      setError("Method name and description are both required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEditing && method) {
        await closureMethodsService.update(method.id, { methodName, description });
      } else {
        await closureMethodsService.create({ methodName, description });
      }
      onSaved();
      onClose();
    } catch {
      setError("Could not save the closure method. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="relative w-full max-w-[550px] sm:m-0 rounded-3xl bg-white p-6 lg:p-10 dark:bg-gray-900"
    >
      <div>
        <h4 className="text-title-sm mb-1 font-semibold text-gray-800 dark:text-white/90">
          {isEditing ? `Edit Closure Method — ${method?.internalName}` : "New Closure Method"}
        </h4>
        <p className="mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">
          The internal name is generated automatically from the method name and can&apos;t be edited.
        </p>

        <div className="space-y-4">
          {isEditing && (
            <div>
              <Label>Internal name</Label>
              <div className="flex h-11 items-center rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                {method?.internalName}
              </div>
            </div>
          )}
          <div>
            <Label>Method name</Label>
            <Input
              type="text"
              value={methodName}
              onChange={(e) => setMethodName(e.target.value)}
              placeholder="Method name"
            />
          </div>
          <div>
            <Label>Description</Label>
            <TextArea
              rows={4}
              value={description}
              onChange={setDescription}
              placeholder="Method description"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row w-full items-center justify-between gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="w-full h-11 rounded-lg ring-1 ring-inset ring-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 rounded-lg bg-brand-500 text-sm font-medium text-gray-900 hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : isEditing ? "Save changes" : "Create method"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
