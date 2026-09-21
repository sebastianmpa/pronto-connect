import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import atcFormsService from "../../lib/atc-forms/atcFormsService";
import ordersService from "../../lib/orders/ordersService";
import type { AtcFormSubmissionType } from "../../lib/atc-forms/types";

const SUPPORTED_TYPES: AtcFormSubmissionType[] = [
  "claim",
  "return",
  "cancellation",
];

const TYPE_LABELS: Record<AtcFormSubmissionType, string> = {
  claim: "Claim",
  return: "Return",
  cancellation: "Cancellation",
};

const CLAIM_REASONS = [
  ["wrong_part", "Wrong part"],
  ["damaged_part", "Damaged part"],
  ["missing_part", "Missing part"],
  ["package_not_received", "Package never received"],
  ["cancelled_not_received", "Cancelled part received"],
  ["warranty_manufacturing_defect", "Warranty - Manufacturing defect"],
] as const;

const CLAIM_REASONS_WITH_REQUEST_TYPE = new Set([
  "wrong_part",
  "damaged_part",
  "package_not_received",
  "warranty_manufacturing_defect",
]);

const CLAIM_REASONS_REQUIRING_IMAGES = new Set([
  "wrong_part",
  "damaged_part",
  "missing_part",
  "warranty_manufacturing_defect",
]);

interface CreateAtcFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formTypes: string[];
  initialOrderNumber?: string;
  onCreated: () => void | Promise<void>;
}

type FormValues = Record<string, string>;

const fieldClassName = "space-y-1.5";

function normalizedSupportedTypes(
  formTypes: string[],
): AtcFormSubmissionType[] {
  const typesFromApi = new Set(
    formTypes.map((value) => value.trim().toLowerCase()),
  );
  return SUPPORTED_TYPES.filter((type) => typesFromApi.has(type));
}

export default function CreateAtcFormModal({
  isOpen,
  onClose,
  formTypes,
  initialOrderNumber = "",
  onCreated,
}: CreateAtcFormModalProps) {
  const availableTypes = useMemo(
    () => normalizedSupportedTypes(formTypes),
    [formTypes],
  );
  const [selectedType, setSelectedType] = useState<AtcFormSubmissionType | "">(
    "",
  );
  const [values, setValues] = useState<FormValues>({});
  const [images, setImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lookingUpOrder, setLookingUpOrder] = useState(false);
  const [orderLookupMessage, setOrderLookupMessage] = useState<string | null>(null);
  const orderLookupRequestRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedType(availableTypes[0] ?? "");
    setValues({ order_number: initialOrderNumber, origin: "Pronto Connect" });
    setImages([]);
    setError(null);
    setSuccess(null);
    setLookingUpOrder(false);
    setOrderLookupMessage(null);
  }, [isOpen, initialOrderNumber, availableTypes]);

  useEffect(() => {
    const orderNumber = (values.order_number ?? "").trim();
    const requestId = ++orderLookupRequestRef.current;

    if (!isOpen || !/^(?:E-)?\d{3,}/i.test(orderNumber)) {
      setLookingUpOrder(false);
      setOrderLookupMessage(null);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setLookingUpOrder(true);
      setOrderLookupMessage(null);

      try {
        const order = await ordersService.getInvoiceDetail(orderNumber);
        if (requestId !== orderLookupRequestRef.current) return;

        const billingAddress = order?.header?.billing_address;
        const customerName = [
          billingAddress?.first_name,
          billingAddress?.last_name,
        ]
          .map((value) => value?.trim())
          .filter(Boolean)
          .join(" ");
        const customerEmail = billingAddress?.email?.trim() ?? "";

        setValues((current) => {
          if (current.order_number?.trim() !== orderNumber) return current;

          return {
            ...current,
            customer_name: customerName || current.customer_name || "",
            customer_email: customerEmail || current.customer_email || "",
          };
        });

        if (!customerName || !customerEmail) {
          setOrderLookupMessage(
            "The order was found, but some customer information is unavailable. Complete it manually.",
          );
        }
      } catch (lookupError: unknown) {
        if (requestId !== orderLookupRequestRef.current) return;
        setOrderLookupMessage(getOrderLookupErrorMessage(lookupError));
      } finally {
        if (requestId === orderLookupRequestRef.current) {
          setLookingUpOrder(false);
        }
      }
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, values.order_number]);

  const setValue = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
  };

  const setOrderNumber = (orderNumber: string) => {
    setValues((current) => ({
      ...current,
      order_number: orderNumber,
      ...(current.order_number?.trim() !== orderNumber.trim()
        ? { customer_name: "", customer_email: "" }
        : {}),
    }));
  };

  const changeType = (type: AtcFormSubmissionType) => {
    setSelectedType(type);
    setValues((current) => ({
      order_number: current.order_number ?? initialOrderNumber,
      customer_name: current.customer_name ?? "",
      customer_email: current.customer_email ?? "",
      origin: "Pronto Connect",
    }));
    setImages([]);
    setError(null);
    setSuccess(null);
  };

  const handleImagesChanged = (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    const invalidFile = selectedFiles.find(
      (file) => !file.type.startsWith("image/") || file.size > 3 * 1024 * 1024,
    );

    if (invalidFile) {
      setImages([]);
      setError("Images must be image files smaller than 3 MB.");
      return;
    }

    if (selectedFiles.length > 10) {
      setImages([]);
      setError("A request can include up to 10 images.");
      return;
    }

    setImages(selectedFiles);
    setError(null);
  };

  const validate = (): string | null => {
    const requiredBaseFields = [
      "customer_name",
      "customer_email",
      "order_number",
    ];
    const missingBaseField = requiredBaseFields.find(
      (field) => !values[field]?.trim(),
    );

    if (missingBaseField)
      return "Customer name, email address, and order number are required.";
    if (!selectedType) return "Select a request type.";

    if (selectedType === "claim") {
      const reason = values.claim_reason;
      if (!reason) return "Select the reason for the claim.";

      const requiredByReason: Record<string, string[]> = {
        wrong_part: [
          "wp_part_order",
          "wp_part_received",
          "request_type",
          "package_condition",
          "comment",
          "received_recent",
        ],
        damaged_part: [
          "dp_part_received",
          "request_type",
          "package_condition",
          "comment",
          "received_recent",
        ],
        missing_part: [
          "mp_part_missing",
          "package_condition",
          "comment",
          "received_recent",
        ],
        package_not_received: [
          "nr_carrier_delivered",
          "nr_shipping_address",
          "nr_notification_received",
          "request_type",
          "package_condition",
          "comment",
          "received_recent",
        ],
        cancelled_not_received: [
          "cp_part_received",
          "cp_where_sent",
          "cp_when_sent",
          "package_condition",
          "comment",
          "received_recent",
        ],
        warranty_manufacturing_defect: [
          "wa_part_defective",
          "request_type",
          "package_condition",
          "comment",
          "received_recent",
        ],
      };
      if (requiredByReason[reason]?.some((field) => !values[field]?.trim())) {
        return "Complete all fields required for the selected claim reason.";
      }
      if (CLAIM_REASONS_REQUIRING_IMAGES.has(reason) && images.length === 0) {
        return "Attach at least one image for the selected claim reason.";
      }
    }

    if (selectedType === "return") {
      const requiredFields = [
        "part_number",
        "return_reason",
        "is_last_30_days",
        "is_original_pkg",
        "is_electronic",
      ];
      if (requiredFields.some((field) => !values[field]?.trim())) {
        return "Complete all return eligibility fields.";
      }
    }

    if (
      selectedType === "cancellation" &&
      (!values.cancellation_reason?.trim() || !values.ticket_text?.trim())
    ) {
      return "Cancellation reason and comment are required.";
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationMessage = validate();
    if (validationMessage || !selectedType) {
      setError(validationMessage ?? "Select a request type.");
      return;
    }

    const payload = new FormData();
    Object.entries(values).forEach(([key, value]) =>
      payload.append(key, value.trim()),
    );
    images.forEach((file) => payload.append("images[]", file));

    setSaving(true);
    setError(null);
    try {
      const result = await atcFormsService.submit(selectedType, payload);
      await onCreated();
      setSuccess(
        result.zohoTicket
          ? `${TYPE_LABELS[selectedType]} #${result.id} created. Zoho ticket: ${result.zohoTicket}.`
          : `${TYPE_LABELS[selectedType]} #${result.id} created successfully.`,
      );
    } catch (submissionError: unknown) {
      const responseMessage =
        typeof submissionError === "object" &&
        submissionError !== null &&
        "response" in submissionError
          ? (submissionError as { response?: { data?: { message?: string } } })
              .response?.data?.message
          : undefined;
      setError(
        responseMessage ||
          "Could not create the client request. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="relative my-auto w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 dark:bg-gray-900"
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-6 pr-10">
          <h4 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
            Create client request
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select a request type, complete the customer information, and submit
            without leaving this page.
          </p>
        </div>

        {availableTypes.length === 0 ? (
          <div className="rounded-lg bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
            Claim, Return, and Cancellation types are not available from the
            request-types service.
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={fieldClassName}>
                <Label>Request type</Label>
                <select
                  value={selectedType}
                  onChange={(event) =>
                    changeType(event.target.value as AtcFormSubmissionType)
                  }
                  disabled={saving || Boolean(success)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  {availableTypes.map((type) => (
                    <option key={type} value={type}>
                      {TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div className={fieldClassName}>
                <Label>Order number *</Label>
                <Input
                  type="text"
                  value={values.order_number ?? ""}
                  onChange={(event) => setOrderNumber(event.target.value)}
                  placeholder="E-123456"
                  disabled={saving || Boolean(success)}
                />
                <p
                  aria-live="polite"
                  className={`text-xs ${
                    orderLookupMessage
                      ? "text-warning-600 dark:text-warning-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {lookingUpOrder
                    ? "Looking up customer information…"
                    : orderLookupMessage ??
                      "Customer name and email are filled from the order automatically."}
                </p>
              </div>
              <div className={fieldClassName}>
                <Label>Customer name *</Label>
                <Input
                  type="text"
                  value={values.customer_name ?? ""}
                  onChange={(event) =>
                    setValue("customer_name", event.target.value)
                  }
                  placeholder="Customer name"
                  disabled={saving || Boolean(success)}
                />
              </div>
              <div className={fieldClassName}>
                <Label>Email address *</Label>
                <Input
                  type="email"
                  value={values.customer_email ?? ""}
                  onChange={(event) =>
                    setValue("customer_email", event.target.value)
                  }
                  placeholder="customer@example.com"
                  disabled={saving || Boolean(success)}
                />
              </div>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-5 dark:border-white/[0.06]">
              {selectedType === "claim" && (
                <ClaimFields
                  values={values}
                  setValue={setValue}
                  images={images}
                  onImagesChanged={handleImagesChanged}
                  disabled={saving || Boolean(success)}
                />
              )}
              {selectedType === "return" && (
                <ReturnFields
                  values={values}
                  setValue={setValue}
                  images={images}
                  onImagesChanged={handleImagesChanged}
                  disabled={saving || Boolean(success)}
                />
              )}
              {selectedType === "cancellation" && (
                <CancellationFields
                  values={values}
                  setValue={setValue}
                  disabled={saving || Boolean(success)}
                />
              )}
            </div>

            {error && (
              <div className="mt-5 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-5 rounded-lg bg-success-50 px-4 py-3 text-sm text-success-700 dark:bg-success-500/10 dark:text-success-400">
                {success}
              </div>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="h-11 rounded-lg border border-gray-300 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
              >
                {success ? "Done" : "Cancel"}
              </button>
              {!success && (
                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 rounded-lg bg-brand-500 px-5 text-sm font-medium text-gray-900 transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Creating…"
                    : `Create ${selectedType ? TYPE_LABELS[selectedType] : "request"}`}
                </button>
              )}
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

function getOrderLookupErrorMessage(error: unknown): string {
  const response =
    typeof error === "object" && error !== null && "response" in error
      ? (error as {
          response?: { status?: number; data?: { message?: string } };
        }).response
      : undefined;

  if (response?.status === 401) {
    return "Your session has expired. Sign in again and retry the order lookup.";
  }

  if (response?.status === 403) {
    return "Your account does not have permission to read order information.";
  }

  if (response?.status === 404) {
    return "This order was not found. You can enter customer information manually.";
  }

  if (response?.data?.message) {
    return response.data.message;
  }

  const message = error instanceof Error ? error.message : "";
  if (message.includes("getInvoiceDetail")) {
    return "Order lookup is unavailable in the loaded frontend version. Refresh or redeploy Pronto Connect.";
  }

  return "Customer information could not be found for this order. You can enter it manually.";
}

function ClaimFields({
  values,
  setValue,
  images,
  onImagesChanged,
  disabled,
}: FieldProps & ImageFieldProps) {
  const reason = values.claim_reason;
  const hasRequestType = CLAIM_REASONS_WITH_REQUEST_TYPE.has(reason);
  const showImage = Boolean(reason) && reason !== "cancelled_not_received";
  const imageConfig: Record<string, { label: string; required: boolean }> = {
    wrong_part: {
      label: "Upload images showing the wrong part",
      required: true,
    },
    damaged_part: { label: "Upload images showing the damage", required: true },
    missing_part: {
      label: "Upload images (e.g. of the open box)",
      required: true,
    },
    package_not_received: {
      label: "Upload image of the carrier notification",
      required: false,
    },
    warranty_manufacturing_defect: {
      label: "Upload images showing the defect",
      required: true,
    },
  };

  return (
    <div className="space-y-4">
      <div className={fieldClassName}>
        <Label>Reason for the claims: *</Label>
        <select
          value={reason ?? ""}
          onChange={(event) => setValue("claim_reason", event.target.value)}
          disabled={disabled}
          className={selectClassName}
        >
          <option value="">Select a reason...</option>
          {CLAIM_REASONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {reason === "wrong_part" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Part number from order (e.g., 782363 X 1) *"
            name="wp_part_order"
            values={values}
            setValue={setValue}
            disabled={disabled}
          />
          <TextField
            label="Part number received (e.g., 782363 X 1) *"
            name="wp_part_received"
            values={values}
            setValue={setValue}
            disabled={disabled}
          />
        </div>
      )}
      {reason === "damaged_part" && (
        <TextField
          label="Damaged Part number received (e.g., 782363 X 1) *"
          name="dp_part_received"
          values={values}
          setValue={setValue}
          disabled={disabled}
        />
      )}
      {reason === "missing_part" && (
        <div className="space-y-4">
          <ClaimNotice>
            PLEASE RECHECK THE PACKAGE BEFORE FILL THE FORM TO MAKE SURE THE
            ITEM IS NOT INCLUDE.
          </ClaimNotice>
          <TextField
            label="Part number missing (e.g., 782363 X 1) *"
            name="mp_part_missing"
            values={values}
            setValue={setValue}
            disabled={disabled}
          />
        </div>
      )}
      {reason === "package_not_received" && (
        <div className="space-y-4">
          <ClaimNotice>
            Please check around the delivery location for your package.
          </ClaimNotice>
          <YesNoField
            label="Did the carrier mark it as delivered? *"
            name="nr_carrier_delivered"
            values={values}
            setValue={setValue}
            disabled={disabled}
          />
          <TextField
            label="Shipping address *"
            name="nr_shipping_address"
            values={values}
            setValue={setValue}
            disabled={disabled}
          />
          <YesNoField
            label="If you've received a notification from the carrier about the missing package in your email (check Spam), did you receive it? *"
            name="nr_notification_received"
            values={values}
            setValue={setValue}
            disabled={disabled}
          />
        </div>
      )}
      {reason === "cancelled_not_received" && (
        <div className="space-y-4">
          <TextField
            label="Cancelled Part number but received (e.g., 782363 X 1) *"
            name="cp_part_received"
            values={values}
            setValue={setValue}
            disabled={disabled}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <RadioField
              label="Where did you send the cancellation request? *"
              name="cp_where_sent"
              values={values}
              setValue={setValue}
              options={[
                ["email", "Email"],
                ["call", "Call"],
              ]}
              disabled={disabled}
            />
            <TextField
              label="When did you send the cancellation request? *"
              name="cp_when_sent"
              values={values}
              setValue={setValue}
              disabled={disabled}
              type="date"
            />
          </div>
        </div>
      )}
      {reason === "warranty_manufacturing_defect" && (
        <TextField
          label="Defective Part number received (e.g., 782363 X 1) *"
          name="wa_part_defective"
          values={values}
          setValue={setValue}
          disabled={disabled}
        />
      )}
      {reason && (
        <ClaimCommonFields
          values={values}
          setValue={setValue}
          disabled={disabled}
          hasRequestType={hasRequestType}
          allowsNeverReceived={reason !== "missing_part"}
          receivedRecentLabel={
            reason === "package_not_received"
              ? "Was the part not received in the last 3 months? *"
              : "Was the part received the last 3 months? *"
          }
        />
      )}
      {showImage && imageConfig[reason] && (
        <ImageField
          images={images}
          onImagesChanged={onImagesChanged}
          disabled={disabled}
          label={imageConfig[reason].label}
          required={imageConfig[reason].required}
        />
      )}
    </div>
  );
}

function ClaimCommonFields({
  values,
  setValue,
  disabled,
  hasRequestType,
  allowsNeverReceived,
  receivedRecentLabel,
}: FieldProps & {
  hasRequestType: boolean;
  allowsNeverReceived: boolean;
  receivedRecentLabel: string;
}) {
  return (
    <div className="space-y-4">
      {hasRequestType && (
        <RadioField
          label="Would you like to receive: *"
          name="request_type"
          values={values}
          setValue={setValue}
          options={[
            ["replacement", "Replacement"],
            ["refund", "Refund"],
          ]}
          disabled={disabled}
        />
      )}
      <RadioField
        label="Package condition *"
        name="package_condition"
        values={values}
        setValue={setValue}
        options={[
          ["good", "Good condition"],
          ["damaged", "Damaged"],
          ["broken", "Broken"],
          ["open", "Open"],
          ...(allowsNeverReceived
            ? [["never_received", "Never Received"] as const]
            : []),
        ]}
        disabled={disabled}
      />
      <div className={fieldClassName}>
        <Label>Comment *</Label>
        <TextArea
          rows={3}
          value={values.comment ?? ""}
          onChange={(value) => setValue("comment", value)}
          placeholder="Describe the issue"
          disabled={disabled}
        />
      </div>
      <YesNoField
        label={receivedRecentLabel}
        name="received_recent"
        values={values}
        setValue={setValue}
        disabled={disabled}
      />
    </div>
  );
}

function ClaimNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-warning-400 bg-warning-50 px-4 py-3 text-sm leading-6 text-gray-700 dark:bg-warning-500/10 dark:text-warning-200">
      <span className="font-semibold">ⓘ NOTE:</span> {children}
    </div>
  );
}

function ReturnFields({
  values,
  setValue,
  images,
  onImagesChanged,
  disabled,
}: FieldProps & ImageFieldProps) {
  return (
    <div className="space-y-4">
      <TextField
        label="Part number"
        name="part_number"
        values={values}
        setValue={setValue}
        disabled={disabled}
      />
      <SelectField
        label="Reason for the return"
        name="return_reason"
        values={values}
        setValue={setValue}
        options={[
          ["I ordered the wrong part", "I ordered the wrong part"],
          ["I don't want the part anymore", "I don't want the part anymore"],
          ["I just want to return the part", "I just want to return the part"],
        ]}
        disabled={disabled}
      />
      <YesNoField
        label="Was the part received in the last 30 days?"
        name="is_last_30_days"
        values={values}
        setValue={setValue}
        disabled={disabled}
      />
      <YesNoField
        label="Is the part new, non-used and in re-sellable condition?"
        name="is_original_pkg"
        values={values}
        setValue={setValue}
        disabled={disabled}
      />
      <YesNoField
        label="Is this an electronic part?"
        name="is_electronic"
        values={values}
        setValue={setValue}
        disabled={disabled}
      />
      <ImageField
        images={images}
        onImagesChanged={onImagesChanged}
        disabled={disabled}
      />
    </div>
  );
}

function CancellationFields({ values, setValue, disabled }: FieldProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
        Cancellation requests are evaluated before approval. They can only be
        approved while the order has not shipped.
      </div>
      <SelectField
        label="Cancellation reason"
        name="cancellation_reason"
        values={values}
        setValue={setValue}
        options={[
          ["No longer need it", "No longer need it"],
          ["Already bought the part", "Already bought the part"],
          ["Order wrong item", "Order wrong item"],
          ["Long wait", "Long wait"],
          ["Price increased", "Price increased"],
          ["Shipping Cost", "Shipping Cost"],
        ]}
        disabled={disabled}
      />
      <div className={fieldClassName}>
        <Label>Comment</Label>
        <TextArea
          rows={4}
          value={values.ticket_text ?? ""}
          onChange={(value) => setValue("ticket_text", value)}
          placeholder="Describe the cancellation request"
        />
      </div>
    </div>
  );
}

interface FieldProps {
  values: FormValues;
  setValue: (name: string, value: string) => void;
  disabled: boolean;
}
interface ImageFieldProps {
  images: File[];
  onImagesChanged: (files: FileList | null) => void;
}

const selectClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

function TextField({
  label,
  name,
  values,
  setValue,
  disabled,
  hint,
  type = "text",
}: FieldProps & {
  label: string;
  name: string;
  hint?: string;
  type?: "text" | "date";
}) {
  return (
    <div className={fieldClassName}>
      <Label>{label}</Label>
      <Input
        type={type}
        value={values[name] ?? ""}
        onChange={(event) => setValue(name, event.target.value)}
        placeholder={label}
        disabled={disabled}
        hint={hint}
      />
    </div>
  );
}
function RadioField({
  label,
  name,
  values,
  setValue,
  options,
  disabled,
}: FieldProps & {
  label: string;
  name: string;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <div className={fieldClassName}>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map(([value, text]) => (
          <label
            key={value}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <input
              type="radio"
              name={name}
              value={value}
              checked={values[name] === value}
              onChange={(event) => setValue(name, event.target.value)}
              disabled={disabled}
              className="h-4 w-4 accent-brand-500"
            />
            {text}
          </label>
        ))}
      </div>
    </div>
  );
}
function SelectField({
  label,
  name,
  values,
  setValue,
  options,
  disabled,
}: FieldProps & {
  label: string;
  name: string;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <div className={fieldClassName}>
      <Label>{label}</Label>
      <select
        value={values[name] ?? ""}
        onChange={(event) => setValue(name, event.target.value)}
        disabled={disabled}
        className={selectClassName}
      >
        <option value="">Select an option...</option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}
function YesNoField({
  label,
  name,
  values,
  setValue,
  disabled,
}: FieldProps & { label: string; name: string }) {
  return (
    <div className={fieldClassName}>
      <Label>{label}</Label>
      <div className="flex gap-3">
        {["yes", "no"].map((option) => (
          <label
            key={option}
            className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={values[name] === option}
              onChange={(event) => setValue(name, event.target.value)}
              disabled={disabled}
              className="h-4 w-4 accent-brand-500"
            />
            {option === "yes" ? "Yes" : "No"}
          </label>
        ))}
      </div>
    </div>
  );
}
function ImageField({
  images,
  onImagesChanged,
  disabled,
  label = "Attach images",
  required = false,
}: ImageFieldProps & {
  disabled: boolean;
  label?: string;
  required?: boolean;
}) {
  return (
    <div className={fieldClassName}>
      <Label>
        {label} {required ? "*" : "(optional)"}
      </Label>
      <input
        type="file"
        accept="image/png,image/jpeg,image/gif"
        multiple
        disabled={disabled}
        onChange={(event) => onImagesChanged(event.target.files)}
        className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 dark:text-gray-400 dark:file:bg-white/[0.08] dark:file:text-gray-200"
      />
      <p className="text-xs text-gray-500 dark:text-gray-400">
        PNG, JPG, or GIF; maximum 3 MB per image and 10 files.{" "}
        {images.length > 0 ? `${images.length} selected.` : ""}
      </p>
    </div>
  );
}
