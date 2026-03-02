"use client";

import DOMPurify from "dompurify";

interface SafeHtmlProps {
  html: string;
  className?: string;
}

// Content is sanitized with DOMPurify before rendering
export function SafeHtml({ html, className }: SafeHtmlProps) {
  const sanitized = DOMPurify.sanitize(html);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
