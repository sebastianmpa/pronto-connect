import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import type { OrderDetail } from "../../lib/orders/types";
import orderCustomerInfoService, {
  getCustomerInfoUpdateError,
  type CustomerAddressType,
  type UpdateCustomerInfoPayload,
  type UpdateCustomerInfoResponse,
} from "../../lib/orders/orderCustomerInfoService";

interface ChangeCustomerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDetail;
  onUpdated?: () => void;
}

interface CustomerInfoForm {
  email: string;
  phone: string;
  address: string;
}

interface AddressSource {
  email?: string | null;
  phone?: string | null;
  street_1?: string | null;
}

const EMPTY_FORM: CustomerInfoForm = {
  email: "",
  phone: "",
  address: "",
};

function formFromAddress(address?: AddressSource | null): CustomerInfoForm {
  if (!address) return { ...EMPTY_FORM };

  return {
    email: String(address.email ?? ""),
    phone: String(address.phone ?? ""),
    address: String(address.street_1 ?? ""),
  };
}

function normalizeForm(form: CustomerInfoForm): CustomerInfoForm {
  return {
    email: form.email.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
  };
}

function validateForm(form: CustomerInfoForm): string | null {
  const normalized = normalizeForm(form);

  if (normalized.email) {
    if (normalized.email.length > 100) {
      return "Email cannot contain more than 100 characters.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
      return "Enter a valid email address.";
    }
  }

  if (normalized.phone.length > 35) {
    return "Phone cannot contain more than 35 characters.";
  }

  if (normalized.address.length > 60) {
    return "Address cannot contain more than 60 characters.";
  }

  return null;
}

function successMessage(
  response: UpdateCustomerInfoResponse,
  addressType: CustomerAddressType,
): string {
  const target = addressType === "billing" ? "Billing" : "Shipping";

  if (response.shipworks?.updated === true) {
    return `${target} information was updated successfully in BigCommerce and ShipWorks.`;
  }

  if (response.shipworks?.order_found === false) {
    return `${target} information was updated in BigCommerce. The order was not found in ShipWorks.`;
  }

  return `${target} information was updated successfully.`;
}

export default function ChangeCustomerInfoModal({
  isOpen,
  onClose,
  order,
  onUpdated,
}: ChangeCustomerInfoModalProps) {
  const [addressType, setAddressType] = useState<CustomerAddressType>("shipping");
  const [shippingForm, setShippingForm] = useState<CustomerInfoForm>(EMPTY_FORM);
  const [billingForm, setBillingForm] = useState<CustomerInfoForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setAddressType("shipping");
    setShippingForm(formFromAddress(order.shipping_addresses?.[0] ?? null));
    setBillingForm(formFromAddress(order.header?.billing_address ?? null));
    setSaving(false);
    setError(null);
    setSuccess(null);
    setUpdated(false);
  }, [isOpen, order]);

  const activeForm = addressType === "shipping" ? shippingForm : billingForm;

  const originalForm =
    addressType === "shipping"
      ? formFromAddress(order.shipping_addresses?.[0] ?? null)
      : formFromAddress(order.header?.billing_address ?? null);

  const setActiveForm = (
    updater: (current: CustomerInfoForm) => CustomerInfoForm,
  ) => {
    if (addressType === "shipping") {
      setShippingForm(updater);
    } else {
      setBillingForm(updater);
    }
  };

  const changeAddressType = (type: CustomerAddressType) => {
    if (saving) return;

    setAddressType(type);
    setError(null);
    setSuccess(null);
  };

  const updateField = (field: keyof CustomerInfoForm, value: string) => {
    setActiveForm((current) => ({ ...current, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    const validationError = validateForm(activeForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    const current = normalizeForm(activeForm);
    const original = normalizeForm(originalForm);

    const payload: UpdateCustomerInfoPayload = {
      address_type: addressType,
    };

    if (current.email !== original.email) payload.email = current.email;
    if (current.phone !== original.phone) payload.phone = current.phone;
    if (current.address !== original.address) payload.street_1 = current.address;

    if (Object.keys(payload).length === 1) {
      setError("There are no changes to save.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await orderCustomerInfoService.updateCustomerInfo(
        order.order_number,
        payload,
      );

      if (response.success === false) {
        throw new Error(response.message || "Customer information was not updated.");
      }

      setUpdated(true);
      setSuccess(successMessage(response, addressType));
    } catch (saveError) {
      setError(getCustomerInfoUpdateError(saveError));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;

    onClose();

    if (updated) {
      onUpdated?.();
    }
  };

  const tabClass = (type: CustomerAddressType) =>
    [
      "rounded-lg px-4 py-2 text-sm font-semibold transition",
      addressType === type
        ? "bg-brand-500 text-white shadow-sm"
        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
    ].join(" ");

  const inputClass =
    "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30";

  const labelClass =
    "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="relative w-full max-w-[720px] rounded-3xl bg-white p-5 sm:m-0 lg:p-6 dark:bg-gray-900"
    >
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
          Order #{order.order_number}
        </p>
        <h3 className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
          Change customer&apos;s Info
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Update Email, Phone or Address for Shipping or Billing.
        </p>
      </div>

      <div className="mb-5">
        <p className={labelClass}>Update information for</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={tabClass("shipping")}
            onClick={() => changeAddressType("shipping")}
            disabled={saving}
          >
            Shipping
          </button>
          <button
            type="button"
            className={tabClass("billing")}
            onClick={() => changeAddressType("billing")}
            disabled={saving}
          >
            Billing
          </button>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-gray-100 p-4 dark:border-gray-800 md:grid-cols-2">
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            value={activeForm.email}
            maxLength={100}
            onChange={(event) => updateField("email", event.target.value)}
            className={inputClass}
            placeholder="customer@email.com"
            disabled={saving}
          />
        </div>

        <div>
          <label className={labelClass}>Phone</label>
          <input
            type="text"
            value={activeForm.phone}
            maxLength={35}
            onChange={(event) => updateField("phone", event.target.value)}
            className={inputClass}
            placeholder="Customer phone"
            disabled={saving}
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Address</label>
          <input
            type="text"
            value={activeForm.address}
            maxLength={60}
            onChange={(event) => updateField("address", event.target.value)}
            className={inputClass}
            placeholder="Customer address"
            disabled={saving}
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-xl border border-success-200 bg-success-50 p-3 text-sm text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-400">
          {success}
        </div>
      )}

      <div className="mt-5 flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end dark:border-gray-800">
        <Button variant="outline" onClick={handleClose} disabled={saving}>
          {updated ? "Close" : "Cancel"}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Updating..." : "Save changes"}
        </Button>
      </div>
    </Modal>
  );
}
