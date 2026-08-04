import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import { useAuthStore } from "../../store/authStore";
import answeredCallsService from "../../lib/answered-calls/answeredCallsService";
import contactReasonsService from "../../lib/contact-reasons/contactReasonsService";
import closureMethodsService from "../../lib/closure-methods/closureMethodsService";
import { getCallerInfo } from "../../lib/goToConnect/callInfo";
import type { CallNotification } from "../../lib/goToConnect/types";
import type { ContactReasonItem } from "../../lib/contact-reasons/types";
import type { ClosureMethodItem } from "../../lib/closure-methods/types";

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

interface QualifyCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  call: CallNotification | null;
}

export default function QualifyCallModal({ isOpen, onClose, call }: QualifyCallModalProps) {
  const user = useAuthStore((s) => s.user);

  const [reasons, setReasons] = useState<ContactReasonItem[]>([]);
  const [methods, setMethods] = useState<ClosureMethodItem[]>([]);

  const [callDateTime, setCallDateTime] = useState(todayISODate());
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState("");
  const [contactReason, setContactReason] = useState("");
  const [closureMethod, setClosureMethod] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCallDateTime(todayISODate());
    setCustomerPhoneNumber(call ? getCallerInfo(call.event)?.number ?? "" : "");
    setContactReason("");
    setClosureMethod("");
    setError(null);
    setSuccess(false);
    Promise.all([contactReasonsService.getAll(), closureMethodsService.getAll()])
      .then(([r, m]) => {
        setReasons(r);
        setMethods(m);
      })
      .catch(() => {
        setReasons([]);
        setMethods([]);
      });
  }, [isOpen, call]);

  const handleSave = async () => {
    if (!call) return;
    if (!callDateTime || !customerPhoneNumber.trim() || !contactReason || !closureMethod) {
      setError("Please fill in every field before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await answeredCallsService.create({
        agentName: user?.name ?? call.event.agent.name,
        agentEmail: user?.email ?? "",
        callDateTime,
        extension: user?.extensionNumber ?? call.event.agent.extension,
        callId: call.event.conversationId,
        customerPhoneNumber,
        contactReason,
        closureMethod,
        origin: "zoho",
      });
      setSuccess(true);
    } catch {
      setError("Could not save the call qualification. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!call) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="relative w-full max-w-[550px] sm:m-0 rounded-3xl bg-white p-6 lg:p-10 dark:bg-gray-900"
    >
      {success ? (
        <div>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h4 className="text-title-sm mb-1 font-semibold text-gray-800 dark:text-white/90">
            Call qualified
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Thanks — this call has been logged.
          </p>
          <button
            onClick={onClose}
            className="w-full h-11 rounded-lg bg-brand-500 text-sm font-medium text-gray-900 hover:bg-brand-600 transition-colors"
          >
            Close
          </button>
        </div>
      ) : (
        <div>
          <h4 className="text-title-sm mb-1 font-semibold text-gray-800 dark:text-white/90">
            Qualify Call
          </h4>
          <p className="mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Qualifying as <span className="font-medium text-gray-700 dark:text-gray-300">{user?.name}</span>
            {user?.extensionNumber && ` · ext. ${user.extensionNumber}`}
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Call date</Label>
                <Input
                  type="date"
                  value={callDateTime}
                  onChange={(e) => setCallDateTime(e.target.value)}
                />
              </div>
              <div>
                <Label>Customer phone</Label>
                <Input
                  type="text"
                  value={customerPhoneNumber}
                  onChange={(e) => setCustomerPhoneNumber(e.target.value)}
                  placeholder="555-5555555"
                />
              </div>
            </div>

            <div>
              <Label>Contact reason</Label>
              <Select
                options={reasons.map((r) => ({ value: r.reasonName, label: r.reasonName }))}
                onChange={setContactReason}
                placeholder="Select a contact reason"
              />
            </div>

            <div>
              <Label>Closure method</Label>
              <Select
                options={methods.map((m) => ({ value: m.methodName, label: m.methodName }))}
                onChange={setClosureMethod}
                placeholder="Select a closure method"
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
              {saving ? "Saving…" : "Save qualification"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
