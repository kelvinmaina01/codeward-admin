/**
 * Clean, responsive 100% width HTML email generator.
 * Converts markdown & rich text into clean HTML without unwanted borders,
 * headers, or third-party footers.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Wraps content in a 100% width, clean responsive email body with zero unwanted borders or branding.
 */
export function wrapInCleanEmailTemplate(contentHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style type="text/css">
    body {
      margin: 0;
      padding: 16px 20px;
      width: 100% !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 15px;
      line-height: 1.65;
      color: #1e293b;
      background-color: #ffffff;
      -webkit-font-smoothing: antialiased;
    }
    a {
      color: #2563eb;
      text-decoration: underline;
      font-weight: 500;
    }
    p {
      margin: 0 0 16px 0;
    }
  </style>
</head>
<body style="margin: 0; padding: 16px 20px; width: 100% !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.65; color: #1e293b; background-color: #ffffff;">
  <div style="width: 100%; max-width: 100%; margin: 0 auto; word-break: break-word;">
    ${contentHtml}
  </div>
</body>
</html>`.trim();
}

/**
 * Converts Markdown and plain text into clean, 100% width HTML
 */
export function markdownToEmailHtml(markdown: string): string {
  if (!markdown || !markdown.trim()) return "";

  const lines = markdown.split(/\r?\n/);
  const output: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      const text = paragraphBuffer.join("<br />");
      output.push(
        `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.65; color: #1e293b; font-weight: 400;">${formatInline(text)}</p>`,
      );
      paragraphBuffer = [];
    }
  };

  const closeList = () => {
    if (inList) {
      output.push(inList === "ul" ? "</ul>" : "</ol>");
      inList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code blocks ```
    if (trimmed.startsWith("```")) {
      flushParagraph();
      closeList();
      if (inCodeBlock) {
        output.push(
          `<pre style="background: #0f172a; color: #f8fafc; padding: 14px 18px; border-radius: 8px; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 13px; line-height: 1.5; overflow-x: auto; margin: 14px 0;"><code>${escapeHtml(codeBlockContent.join("\n"))}</code></pre>`,
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(rawLine);
      continue;
    }

    // Blank line
    if (!trimmed) {
      flushParagraph();
      closeList();
      continue;
    }

    // Horizontal rule --- or ***
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph();
      closeList();
      output.push(
        `<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />`,
      );
      continue;
    }

    // Headings # ## ###
    const h1Match = trimmed.match(/^#\s+(.+)$/);
    if (h1Match) {
      flushParagraph();
      closeList();
      output.push(
        `<h1 style="margin: 22px 0 12px 0; font-size: 24px; font-weight: 700; color: #0f172a; line-height: 1.25;">${formatInline(h1Match[1])}</h1>`,
      );
      continue;
    }

    const h2Match = trimmed.match(/^##\s+(.+)$/);
    if (h2Match) {
      flushParagraph();
      closeList();
      output.push(
        `<h2 style="margin: 20px 0 10px 0; font-size: 19px; font-weight: 600; color: #0f172a; line-height: 1.3;">${formatInline(h2Match[1])}</h2>`,
      );
      continue;
    }

    const h3Match = trimmed.match(/^###\s+(.+)$/);
    if (h3Match) {
      flushParagraph();
      closeList();
      output.push(
        `<h3 style="margin: 18px 0 8px 0; font-size: 16px; font-weight: 600; color: #334155; line-height: 1.35;">${formatInline(h3Match[1])}</h3>`,
      );
      continue;
    }

    // Blockquote >
    const bqMatch = trimmed.match(/^>\s*(.+)$/);
    if (bqMatch) {
      flushParagraph();
      closeList();
      output.push(
        `<blockquote style="border-left: 3px solid #cbd5e1; padding-left: 14px; margin: 14px 0; color: #475569; font-style: italic;">${formatInline(bqMatch[1])}</blockquote>`,
      );
      continue;
    }

    // Bullet lists - or *
    const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      if (inList !== "ul") {
        closeList();
        output.push(
          `<ul style="margin: 8px 0 16px 0; padding-left: 24px; color: #1e293b;">`,
        );
        inList = "ul";
      }
      output.push(
        `<li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">${formatInline(ulMatch[1])}</li>`,
      );
      continue;
    }

    // Numbered lists 1. 2.
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      if (inList !== "ol") {
        closeList();
        output.push(
          `<ol style="margin: 8px 0 16px 0; padding-left: 24px; color: #1e293b;">`,
        );
        inList = "ol";
      }
      output.push(
        `<li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6;">${formatInline(olMatch[1])}</li>`,
      );
      continue;
    }

    // Regular line in paragraph
    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  closeList();

  const bodyContent = output.join("\n");
  return wrapInCleanEmailTemplate(bodyContent);
}

/**
 * Format inline elements: Bold, Italic, Links, Buttons, Inline Code
 */
function formatInline(text: string): string {
  let res = text;

  // CTA button syntax: [button: Text](url) or [button:Text](url)
  res = res.replace(
    /\[button:\s*([^\]]+)\]\(([^)]+)\)/gi,
    `<a href="$2" target="_blank" style="display: inline-block; font-size: 14px; font-weight: 600; color: #ffffff !important; background-color: #2563eb; text-decoration: none; padding: 10px 20px; border-radius: 6px; margin: 10px 0;">$1</a>`,
  );

  // Markdown links: [Text](url)
  res = res.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    `<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: 500; word-break: break-word;">$1</a>`,
  );

  // Raw URLs (not already part of an href="")
  res = res.replace(
    /(^|[^"'])(https?:\/\/[^\s<]+)/g,
    `$1<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: 500; word-break: break-word;">$2</a>`,
  );

  // Bold: **text** or __text__
  res = res.replace(/\*\*([^*]+)\*\*/g, `<strong style="font-weight: 600; color: #0f172a;">$1</strong>`);
  res = res.replace(/__([^_]+)__/g, `<strong style="font-weight: 600; color: #0f172a;">$1</strong>`);

  // Italic: *text* or _text_
  res = res.replace(/\*([^*]+)\*/g, `<em>$1</em>`);
  res = res.replace(/_([^_]+)_/g, `<em>$1</em>`);

  // Strikethrough: ~~text~~
  res = res.replace(/~~([^~]+)~~/g, `<del style="color: #94a3b8;">$1</del>`);

  // Inline code: `code`
  res = res.replace(
    /`([^`]+)`/g,
    `<code style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.9em; color: #0f172a;">$1</code>`,
  );

  return res;
}

/**
 * Strips markdown markup to create a clean plain text fallback
 * while keeping hyperlinks readable: e.g. "Google (https://google.com)"
 */
export function markdownToPlainText(markdown: string): string {
  if (!markdown) return "";
  let text = markdown;

  // Convert buttons and links to: Text (url)
  text = text.replace(/\[button:\s*([^\]]+)\]\(([^)]+)\)/gi, "$1: $2");
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");

  // Strip headers
  text = text.replace(/^#+\s+/gm, "");

  // Strip bold/italic/strike
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");
  text = text.replace(/~~([^~]+)~~/g, "$1");

  // Strip blockquote symbols
  text = text.replace(/^>\s+/gm, "");

  // Strip inline code backticks
  text = text.replace(/`([^`]+)`/g, "$1");

  // Strip triple backticks
  text = text.replace(/```[a-z]*\n?/gi, "");

  return text.trim();
}
