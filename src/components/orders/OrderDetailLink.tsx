import { useLocation, useNavigate } from "react-router";

interface OrderDetailLinkProps {
  orderNumber: string | number | null | undefined;
  tooltip?: string;
  className?: string;
}

function normalizeOrderNumber(value: string | number | null | undefined): string {
  return String(value ?? "")
    .trim()
    .replace(/^E-/i, "")
    .trim();
}

export default function OrderDetailLink({
  orderNumber,
  tooltip = "Go to order detail",
  className = "",
}: OrderDetailLinkProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const normalizedOrderNumber = normalizeOrderNumber(orderNumber);

  if (!normalizedOrderNumber) return null;

  const openOrderDetail = () => {
    navigate(`/orders/${encodeURIComponent(normalizedOrderNumber)}`, {
      state: {
        from: `${location.pathname}${location.search}${location.hash}`,
      },
    });
  };

  return (
    <button
      type="button"
      onClick={openOrderDetail}
      title={tooltip}
      aria-label={`${tooltip}: ${normalizedOrderNumber}`}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-gray-500 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 ${className}`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2.25 12s3.5-6 9.75-6 9.75 6 9.75 6-3.5 6-9.75 6S2.25 12 2.25 12Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="12"
          cy="12"
          r="2.75"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    </button>
  );
}
