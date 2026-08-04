import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import usersService from "../../lib/users/usersService";
import rolesService from "../../lib/roles/rolesService";
import type { UserItem } from "../../lib/users/types";
import type { RoleItem } from "../../lib/roles/types";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Present when editing an existing user; omitted when creating a new one. */
  user?: UserItem | null;
  onSaved: () => void;
}

export default function UserFormModal({ isOpen, onClose, user, onSaved }: UserFormModalProps) {
  const isEditing = !!user;

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [extensionNumber, setExtensionNumber] = useState("");
  const [zohoUserEmail, setZohoUserEmail] = useState("");
  const [zohoUserId, setZohoUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setEmail(user?.email ?? "");
    setPassword("");
    setRoleId(user?.roleId ?? "");
    setExtensionNumber(user?.extension_number ?? "");
    setZohoUserEmail(user?.zohoUserEmail ?? "");
    setZohoUserId(user?.zohoUserId ?? "");
    setError(null);
    rolesService.getAll().then(setRoles).catch(() => setRoles([]));
  }, [isOpen, user]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !roleId) {
      setError("First name, last name, email and role are all required.");
      return;
    }
    if (!isEditing && !password.trim()) {
      setError("Password is required for new users.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const base = {
        firstName,
        lastName,
        email,
        roleId,
        extension_number: extensionNumber || null,
        zohoUserEmail: zohoUserEmail || null,
        zohoUserId: zohoUserId || null,
      };
      if (isEditing && user) {
        await usersService.update(user.id, {
          ...base,
          ...(password.trim() && { password }),
        });
      } else {
        await usersService.create({ ...base, password });
      }
      onSaved();
      onClose();
    } catch {
      setError("Could not save the user. Please try again.");
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
          {isEditing ? `Edit User — ${user?.email}` : "New User"}
        </h4>
        <p className="mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">
          {isEditing
            ? "Leave the password blank to keep the current one."
            : "The user will be able to sign in with this email and password."}
        </p>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>First name</Label>
              <Input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
            </div>
            <div>
              <Label>Last name</Label>
              <Input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
            </div>
          </div>

          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
          </div>

          <div>
            <Label>Password {isEditing && <span className="text-gray-400">(optional)</span>}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEditing ? "Leave blank to keep current password" : "Password"}
            />
          </div>

          <div>
            <Label>Role</Label>
            <Select
              key={`${user?.id ?? "new"}-${isOpen}`}
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
              defaultValue={roleId}
              onChange={setRoleId}
              placeholder="Select a role"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Extension number</Label>
              <Input type="text" value={extensionNumber} onChange={(e) => setExtensionNumber(e.target.value)} placeholder="e.g. 303" />
            </div>
            <div>
              <Label>Zoho user ID</Label>
              <Input type="text" value={zohoUserId} onChange={(e) => setZohoUserId(e.target.value)} placeholder="Zoho user ID" />
            </div>
          </div>

          <div>
            <Label>Zoho user email</Label>
            <Input type="email" value={zohoUserEmail} onChange={(e) => setZohoUserEmail(e.target.value)} placeholder="user@zoho.com" />
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
            {saving ? "Saving…" : isEditing ? "Save changes" : "Create user"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
