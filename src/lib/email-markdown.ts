/**
 * Email Markdown to responsive, inline-styled HTML converter with
 * bulletproof Outlook & Gmail compatibility.
 *
 * Implements:
 * - Table-based MSO layout for Outlook (desktop & web)
 * - Mobile responsive viewport & media queries for Gmail iOS/Android
 * - Retro styling: Huge outer border (4px solid #0f172a), retro internal radius (18px),
 *   subtle neo-retro offset shadow, and crisp high-contrast typography.
 * - Robust hyperlink rendering with styled anchor tags for all clients.
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
 * Wraps any HTML content in a bulletproof responsive email container
 * featuring the retro huge border, retro internal radius, and Outlook/Gmail table architecture.
 */
export function wrapInRetroEmailTemplate(contentHtml: string): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Codeward Message</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-content { padding: 22px 18px !important; }
      .retro-card { border-width: 3px !important; border-radius: 14px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 30px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!--[if mso]>
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
  <![endif]-->

  <table role="presentation" class="email-container" width="100%" border="0" cellspacing="0" cellpadding="0" align="center" style="max-width: 620px; margin: 0 auto;">
    <tr>
      <td align="center" style="padding: 0;">
        <!-- Retro Main Card: Huge 4px border + 18px retro radius + neo offset shadow -->
        <table role="presentation" class="retro-card" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 4px solid #0f172a; border-radius: 18px; box-shadow: 6px 6px 0px #0f172a; overflow: hidden; border-collapse: separate;">
          <!-- Top Accent Bar -->
          <tr>
            <td style="background-color: #0f172a; height: 8px; font-size: 1px; line-height: 1px;">&nbsp;</td>
          </tr>
          <!-- Body Content Area -->
          <tr>
            <td class="email-content" style="padding: 36px 32px; font-size: 15px; line-height: 1.65; color: #1e293b; text-align: left;">
              ${contentHtml}
            </td>
          </tr>
          <!-- Retro Subtle Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 2px solid #e2e8f0; padding: 14px 28px; text-align: center; font-size: 11px; color: #64748b; font-weight: 500;">
              Sent via <strong style="color: #0f172a;">Codeward Cloud</strong> · Verified Resend Domain
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!--[if mso]>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <![endif]-->
</body>
</html>`.trim();
}

/**
 * Converts Markdown and plain text into the fully styled retro HTML email body
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
          `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 14px 0;"><tr><td style="background: #0f172a; color: #f8fafc; padding: 14px 18px; border-radius: 10px; border: 2px solid #0f172a; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 13px; line-height: 1.5; overflow-x: auto;"><code>${escapeHtml(codeBlockContent.join("\n"))}</code></td></tr></table>`,
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
        `<hr style="border: none; border-top: 2px dashed #cbd5e1; margin: 24px 0;" />`,
      );
      continue;
    }

    // Headings # ## ###
    const h1Match = trimmed.match(/^#\s+(.+)$/);
    if (h1Match) {
      flushParagraph();
      closeList();
      output.push(
        `<h1 style="margin: 22px 0 12px 0; font-size: 24px; font-weight: 800; color: #0f172a; line-height: 1.25; letter-spacing: -0.02em;">${formatInline(h1Match[1])}</h1>`,
      );
      continue;
    }

    const h2Match = trimmed.match(/^##\s+(.+)$/);
    if (h2Match) {
      flushParagraph();
      closeList();
      output.push(
        `<h2 style="margin: 20px 0 10px 0; font-size: 19px; font-weight: 700; color: #0f172a; line-height: 1.3; letter-spacing: -0.01em;">${formatInline(h2Match[1])}</h2>`,
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
        `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 14px 0;"><tr><td style="border-left: 4px solid #0f172a; background-color: #f8fafc; padding: 12px 18px; border-radius: 0 10px 10px 0; font-style: italic; color: #475569; font-size: 15px; line-height: 1.6;">${formatInline(bqMatch[1])}</td></tr></table>`,
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
  return wrapInRetroEmailTemplate(bodyContent);
}

/**
 * Format inline elements: Bold, Italic, Links, Buttons, Inline Code
 */
function formatInline(text: string): string {
  let res = text;

  // CTA button syntax: [button: Text](url) or [button:Text](url)
  res = res.replace(
    /\[button:\s*([^\]]+)\]\(([^)]+)\)/gi,
    `<table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 14px 0; display: inline-block;"><tr><td align="center" style="border-radius: 12px; background-color: #0f172a; border: 2px solid #0f172a; box-shadow: 3px 3px 0px #2563eb;"><a href="$2" target="_blank" style="font-size: 14px; font-weight: 700; color: #ffffff !important; text-decoration: none; padding: 11px 22px; display: inline-block; letter-spacing: 0.02em;">$1 &rarr;</a></td></tr></table>`,
  );

  // Markdown links: [Text](url)
  res = res.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    `<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: 600; word-break: break-word;">$1</a>`,
  );

  // Raw URLs (not already part of an href="")
  res = res.replace(
    /(^|[^"'])(https?:\/\/[^\s<]+)/g,
    `$1<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: 600; word-break: break-word;">$2</a>`,
  );

  // Bold: **text** or __text__
  res = res.replace(/\*\*([^*]+)\*\*/g, `<strong style="font-weight: 700; color: #0f172a;">$1</strong>`);
  res = res.replace(/__([^_]+)__/g, `<strong style="font-weight: 700; color: #0f172a;">$1</strong>`);

  // Italic: *text* or _text_
  res = res.replace(/\*([^*]+)\*/g, `<em>$1</em>`);
  res = res.replace(/_([^_]+)_/g, `<em>$1</em>`);

  // Strikethrough: ~~text~~
  res = res.replace(/~~([^~]+)~~/g, `<del style="color: #94a3b8;">$1</del>`);

  // Inline code: `code`
  res = res.replace(
    /`([^`]+)`/g,
    `<code style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 6px; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.88em; color: #0f172a; border: 1px solid #e2e8f0; font-weight: 500;">$1</code>`,
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
