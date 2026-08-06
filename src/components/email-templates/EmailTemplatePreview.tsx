import { useMemo } from "react";
import DOMPurify from "dompurify";

interface EmailTemplatePreviewProps {
  html: string;
  subject?: string;
  className?: string;
}

const EMPTY_PREVIEW = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email preview</title>
</head>
<body style="margin:0;padding:32px;font-family:Arial,sans-serif;color:#667085;background:#ffffff;">
  Start writing the HTML body to see the email preview.
</body>
</html>`;

function sanitizePreviewDocument(html: string): string {
  const source = html.trim();

  if (!source) {
    return EMPTY_PREVIEW;
  }

  const sanitized = DOMPurify.sanitize(source, {
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ["style"],
    ADD_ATTR: ["target"],
  });

  return sanitized.trim() || EMPTY_PREVIEW;
}

function createDocumentKey(document: string): string {
  let hash = 0;

  for (let index = 0; index < document.length; index += 1) {
    hash = (hash * 31 + document.charCodeAt(index)) | 0;
  }

  return `${document.length}-${hash}`;
}

export default function EmailTemplatePreview({
  html,
  subject,
  className = "",
}: EmailTemplatePreviewProps) {
  const sanitizedDocument = useMemo(() => sanitizePreviewDocument(html), [html]);
  const documentKey = useMemo(
    () => createDocumentKey(sanitizedDocument),
    [sanitizedDocument]
  );

  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02] ${className}`}
    >
      <div className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Subject
        </p>
        <p className="mt-1 break-words text-sm font-medium text-gray-800 dark:text-white/90">
          {subject?.trim() || "No subject"}
        </p>
      </div>

      <iframe
        key={documentKey}
        title="Email template preview"
        srcDoc={sanitizedDocument}
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        className="h-[620px] w-full bg-white"
      />
    </div>
  );
}