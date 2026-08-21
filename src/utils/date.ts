function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** MM/DD/YYYY — falls back to "—" for empty input, or the raw string if it can't be parsed. */
export function formatDate(raw: string | null | undefined): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
}

/** MM/DD/YYYY, h:mm AM/PM — falls back to "—" for empty input, or the raw string if it can't be parsed. */
export function formatDateTime(raw: string | null | undefined): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return `${formatDate(raw)}, ${formatTime(raw)}`;
}

/** h:mm AM/PM — falls back to "—" for empty input, or the raw string if it can't be parsed. */
export function formatTime(raw: string | null | undefined): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  let hours = d.getHours();
  const minutes = pad(d.getMinutes());
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}
