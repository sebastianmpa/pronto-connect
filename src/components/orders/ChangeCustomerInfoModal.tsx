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
  city: string;
  state: string;
  zip: string;
}

interface AddressSource {
  email?: string | null;
  phone?: string | null;
  street_1?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}

const EMPTY_FORM: CustomerInfoForm = {
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
};

function formFromAddress(address?: AddressSource | null): CustomerInfoForm {
  if (!address) return { ...EMPTY_FORM };

  return {
    email: String(address.email ?? ""),
    phone: String(address.phone ?? ""),
    address: String(address.street_1 ?? ""),
    city: String(address.city ?? ""),
    state: String(address.state ?? ""),
    zip: String(address.zip ?? ""),
  };
}

function normalizeForm(form: CustomerInfoForm): CustomerInfoForm {
  return {
    email: form.email.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    zip: form.zip.trim(),
  };
}

function validateForm(form: CustomerInfoForm, label: string): string | null {
  const normalized = normalizeForm(form);

  if (normalized.email) {
    if (normalized.email.length > 100) {
      return `${label}: Email cannot contain more than 100 characters.`;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
      return `${label}: Enter a valid email address.`;
    }
  }

  if (normalized.phone.length > 35) {
    return `${label}: Phone cannot contain more than 35 characters.`;
  }

  if (normalized.address.length > 60) {
    return `${label}: Address cannot contain more than 60 characters.`;
  }

  if (normalized.city.length > 50) {
    return `${label}: City cannot contain more than 50 characters.`;
  }

  if (normalized.state.length > 50) {
    return `${label}: State cannot contain more than 50 characters.`;
  }

  if (normalized.zip.length > 20) {
    return `${label}: ZIP Code cannot contain more than 20 characters.`;
  }

  return null;
}

function buildPayload(
  type: CustomerAddressType,
  currentForm: CustomerInfoForm,
  originalForm: CustomerInfoForm,
): UpdateCustomerInfoPayload | null {
  const current = normalizeForm(currentForm);
  const original = normalizeForm(originalForm);

  const payload: UpdateCustomerInfoPayload = {
    address_type: type,
  };

  if (current.email !== original.email) payload.email = current.email;
  if (current.phone !== original.phone) payload.phone = current.phone;
  if (current.address !== original.address) payload.street_1 = current.address;
  if (current.city !== original.city) payload.city = current.city;
  if (current.state !== original.state) payload.state = current.state;
  if (current.zip !== original.zip) payload.zip = current.zip;

  return Object.keys(payload).length > 1 ? payload : null;
}

function targetSuccessMessage(
  response: UpdateCustomerInfoResponse,
  addressType: CustomerAddressType,
): string {
  const target = addressType === "billing" ? "Billing" : "Shipping";

  if (response.shipworks?.updated === true) {
    return `${target} updated in BigCommerce and ShipWorks.`;
  }

  if (response.shipworks?.order_found === false) {
    return `${target} updated in BigCommerce; the order was not found in ShipWorks.`;
  }

  return `${target} updated successfully.`;
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
  const [originalShippingForm, setOriginalShippingForm] = useState<CustomerInfoForm>(EMPTY_FORM);
  const [originalBillingForm, setOriginalBillingForm] = useState<CustomerInfoForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const shipping = formFromAddress(order.shipping_addresses?.[0] ?? null);
    const billing = formFromAddress(order.header?.billing_address ?? null);

    setAddressType("shipping");
    setShippingForm(shipping);
    setBillingForm(billing);
    setOriginalShippingForm(shipping);
    setOriginalBillingForm(billing);
    setSaving(false);
    setError(null);
    setSuccess(null);
    setUpdated(false);
  }, [isOpen, order]);

  const activeForm = addressType === "shipping" ? shippingForm : billingForm;

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
    const shippingValidationError = validateForm(shippingForm, "Shipping");
    if (shippingValidationError) {
      setAddressType("shipping");
      setError(shippingValidationError);
      return;
    }

    const billingValidationError = validateForm(billingForm, "Billing");
    if (billingValidationError) {
      setAddressType("billing");
      setError(billingValidationError);
      return;
    }

    const shippingPayload = buildPayload(
      "shipping",
      shippingForm,
      originalShippingForm,
    );
    const billingPayload = buildPayload(
      "billing",
      billingForm,
      originalBillingForm,
    );

    if (!shippingPayload && !billingPayload) {
      setError("There are no changes to save in Shipping or Billing.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const successMessages: string[] = [];
    const errorMessages: string[] = [];
    let savedSomething = false;

    if (shippingPayload) {
      try {
        const response = await orderCustomerInfoService.updateCustomerInfo(
          order.order_number,
          shippingPayload,
        );

        if (response.success === false) {
          throw new Error(response.message || "Shipping information was not updated.");
        }

        savedSomething = true;
        setOriginalShippingForm(normalizeForm(shippingForm));
        successMessages.push(targetSuccessMessage(response, "shipping"));
      } catch (saveError) {
        errorMessages.push(`Shipping: ${getCustomerInfoUpdateError(saveError)}`);
      }
    }

    if (billingPayload) {
      try {
        const response = await orderCustomerInfoService.updateCustomerInfo(
          order.order_number,
          billingPayload,
        );

        if (response.success === false) {
          throw new Error(response.message || "Billing information was not updated.");
        }

        savedSomething = true;
        setOriginalBillingForm(normalizeForm(billingForm));
        successMessages.push(targetSuccessMessage(response, "billing"));
      } catch (saveError) {
        errorMessages.push(`Billing: ${getCustomerInfoUpdateError(saveError)}`);
      }
    }

    if (savedSomething) {
      setUpdated(true);
      setSuccess(successMessages.join(" "));
    }

    if (errorMessages.length > 0) {
      setError(errorMessages.join(" "));
    }

    setSaving(false);
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
          Update Email, Phone, Address, City, State or ZIP for Shipping or Billing.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Save changes applies all edits made in both Shipping and Billing.
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

        <div>
          <label className={labelClass}>City</label>
          <input
            type="text"
            value={activeForm.city}
            maxLength={50}
            onChange={(event) => updateField("city", event.target.value)}
            className={inputClass}
            placeholder="Customer city"
            disabled={saving}
          />
        </div>

        <div>
          <label className={labelClass}>State</label>
          <input
            type="text"
            value={activeForm.state}
            maxLength={50}
            onChange={(event) => updateField("state", event.target.value)}
            className={inputClass}
            placeholder="Customer state"
            disabled={saving}
          />
        </div>

        <div>
          <label className={labelClass}>ZIP Code</label>
          <input
            type="text"
            value={activeForm.zip}
            maxLength={20}
            onChange={(event) => updateField("zip", event.target.value)}
            className={inputClass}
            placeholder="Customer ZIP"
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
