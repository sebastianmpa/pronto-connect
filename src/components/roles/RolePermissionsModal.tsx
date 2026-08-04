import { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/modal";
import rolesService from "../../lib/roles/rolesService";
import permissionsService from "../../lib/permissions/permissionsService";
import type { RoleItem } from "../../lib/roles/types";
import type { PermissionItem } from "../../lib/permissions/types";

interface RolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleItem | null;
}

export default function RolePermissionsModal({ isOpen, onClose, role }: RolePermissionsModalProps) {
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !role) return;
    setQuery("");
    setError(null);
    setLoading(true);
    Promise.all([permissionsService.getAll(), rolesService.getPermissions(role.id)])
      .then(([permissions, rolePermissions]) => {
        setAllPermissions(permissions);
        setSelected(new Set(rolePermissions.map((p) => p.id)));
      })
      .catch(() => setError("Could not load permissions. Please try again."))
      .finally(() => setLoading(false));
  }, [isOpen, role]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allPermissions;
    return allPermissions.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }, [allPermissions, query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!role) return;
    setSaving(true);
    setError(null);
    try {
      await rolesService.setPermissions(role.id, Array.from(selected));
      onClose();
    } catch {
      setError("Could not save permissions. Please try again.");
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
          Permissions — {role?.name}
        </h4>
        <p className="mb-4 text-sm leading-6 text-gray-500 dark:text-gray-400">
          {selected.size} of {allPermissions.length} permissions selected.
        </p>

        <input
          type="text"
          placeholder="Search permissions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-3 h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
        />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        ) : (
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">No permissions match your search.</p>
            ) : (
              filtered.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
                  />
                  <span>
                    <span className="block font-medium text-gray-800 dark:text-white/90">{p.name}</span>
                    <span className="block text-xs text-gray-400">{p.description}</span>
                  </span>
                </label>
              ))
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row w-full items-center justify-between gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="w-full h-11 rounded-lg ring-1 ring-inset ring-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full h-11 rounded-lg bg-brand-500 text-sm font-medium text-gray-900 hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save permissions"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
