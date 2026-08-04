import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import rolesService from "../../lib/roles/rolesService";
import type { RoleItem } from "../../lib/roles/types";

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Present when editing an existing role; omitted when creating a new one. */
  role?: RoleItem | null;
  onSaved: () => void;
}

export default function RoleFormModal({ isOpen, onClose, role, onSaved }: RoleFormModalProps) {
  const isEditing = !!role;

  const [name, setName] = useState("");
  const [internalName, setInternalName] = useState("");
  const [internalNameTouched, setInternalNameTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(role?.name ?? "");
    setInternalName(role?.internalName ?? "");
    // Existing roles already have their internal name set — don't auto-overwrite it.
    setInternalNameTouched(isEditing);
    setDescription(role?.description ?? "");
    setError(null);
  }, [isOpen, role, isEditing]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!internalNameTouched) {
      setInternalName(value);
    }
  };

  const handleInternalNameChange = (value: string) => {
    setInternalName(value);
    setInternalNameTouched(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !internalName.trim() || !description.trim()) {
      setError("Name, internal name and description are all required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { name, internalName, description };
      if (isEditing && role) {
        await rolesService.update(role.id, payload);
      } else {
        await rolesService.create(payload);
      }
      onSaved();
      onClose();
    } catch {
      setError("Could not save the role. Please try again.");
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
          {isEditing ? `Edit Role — ${role?.internalName}` : "New Role"}
        </h4>
        <p className="mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">
          The internal name defaults to match the name, but can be set independently.
        </p>

        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Administrator"
            />
          </div>
          <div>
            <Label>Internal name</Label>
            <Input
              type="text"
              value={internalName}
              onChange={(e) => handleInternalNameChange(e.target.value)}
              placeholder="admin"
            />
          </div>
          <div>
            <Label>Description</Label>
            <TextArea
              rows={4}
              value={description}
              onChange={setDescription}
              placeholder="Role description"
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
            {saving ? "Saving…" : isEditing ? "Save changes" : "Create role"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
