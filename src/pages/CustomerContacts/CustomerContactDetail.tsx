import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useLocation, useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import CustomerContactDetailView from "../../components/customer-contacts/CustomerContactDetailView";
import CustomerContactMarkModal from "../../components/customer-contacts/CustomerContactMarkModal";
import customerContactsService from "../../lib/customer-contacts/customerContactsService";
import type {
  CustomerContactDetail as CustomerContactDetailType,
  MarkCustomerContactPayload,
  MarkCustomerContactResponse,
} from "../../lib/customer-contacts/types";

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: unknown; errors?: unknown }
      | undefined;

    if (Array.isArray(data?.errors)) {
      const errors = data.errors.filter(
        (item): item is string => typeof item === "string" && item.trim() !== ""
      );

      if (errors.length > 0) {
        return errors.join(" ");
      }
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export default function CustomerContactDetail() {
  // The route segment contains contact_request_id from the listing.
  const params = useParams<{
    id?: string;
    orderId?: string;
    contactRequestId?: string;
  }>();
  const contactRequestId = params.id ?? params.contactRequestId ?? params.orderId;

  const navigate = useNavigate();
  const location = useLocation();
  const backTo =
    (location.state as { from?: string } | null)?.from ?? "/customer-contacts";

  const [contact, setContact] = useState<CustomerContactDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);
  const [markSuccess, setMarkSuccess] = useState<string | null>(null);
  const [markResponse, setMarkResponse] =
    useState<MarkCustomerContactResponse | null>(null);

  const loadContact = useCallback(
    async (showLoader = true) => {
      if (!contactRequestId) {
        setLoading(false);
        setContact(null);
        setError("The customer contact ID is missing.");
        return;
      }

      if (showLoader) {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await customerContactsService.getById(contactRequestId);
        setContact(response);
      } catch (requestError) {
        setContact(null);
        setError(
          getApiErrorMessage(
            requestError,
            "Could not load the customer contact detail. Please try again."
          )
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [contactRequestId]
  );

  useEffect(() => {
    loadContact(true);
  }, [loadContact]);

  const openMarkModal = () => {
    setMarkError(null);
    setMarkSuccess(null);
    setMarkResponse(null);
    setMarkModalOpen(true);
  };

  const closeMarkModal = () => {
    if (savingContact) return;

    setMarkModalOpen(false);
    setMarkError(null);
    setMarkSuccess(null);
    setMarkResponse(null);
  };

  const handleMarkAsContacted = async (
    payload: MarkCustomerContactPayload
  ) => {
    if (!contact?.order_id) {
      setMarkError("The Order ID is required to register the contact.");
      return;
    }

    setSavingContact(true);
    setMarkError(null);
    setMarkSuccess(null);
    setMarkResponse(null);

    try {
      const response = await customerContactsService.markAsContacted(
        contact.order_id,
        payload
      );

      setMarkResponse(response);
      setMarkSuccess("Customer contact was recorded successfully.");
      await loadContact(false);
    } catch (requestError) {
      setMarkError(
        getApiErrorMessage(
          requestError,
          "Could not record the customer contact. Please try again."
        )
      );
    } finally {
      setSavingContact(false);
    }
  };

  return (
    <>
      <PageMeta
        title={`Customer Contact #${contactRequestId ?? ""} | Pronto Connect`}
        description="Customer contact request detail"
      />
      <PageBreadcrumb pageTitle="Customer Contact Detail" />

      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Customer Contacts
        </button>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <svg
              className="h-8 w-8 animate-spin text-brand-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && contact && (
          <CustomerContactDetailView
            contact={contact}
            markingContact={savingContact}
            onMarkAsContacted={openMarkModal}
          />
        )}
      </div>

      {contact && (
        <CustomerContactMarkModal
          isOpen={markModalOpen}
          contact={contact}
          saving={savingContact}
          error={markError}
          success={markSuccess}
          response={markResponse}
          onClose={closeMarkModal}
          onSubmit={handleMarkAsContacted}
        />
      )}
    </>
  );
}
