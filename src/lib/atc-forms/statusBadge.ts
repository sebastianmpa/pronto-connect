export function statusBadgeClass(status: string | null): string {
  switch (status) {
    case "processed":
      return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400";
    case "cancelled":
      return "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400";
    case "pending":
    default:
      return "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400";
  }
}
