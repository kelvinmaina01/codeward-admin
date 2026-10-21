import { useEffect, useMemo, useRef, useState } from "react";
import { LinkSquare01Icon } from "hugeicons-react";

/**
 * Strip everything executable from an email body before it is rendered.
 *
 * Email HTML is third-party content rendered inside the admin portal's origin.
 * Scripts, frames, forms and inline event handlers are removed, and
 * `javascript:` URLs are dropped, so a hostile email cannot run code in the
 * admin session.
 */
export function sanitizeEmailHtml(raw: string): string {
  try {
    const doc = new DOMParser().parseFromString(raw, "text/html");
    doc.querySelectorAll("script, iframe, object, embed, form, base").forEach((el) => el.remove());
    doc.querySelectorAll("meta[http-equiv]").forEach((el) => el.remove());
    doc.querySelectorAll("*").forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on")) el.removeAttribute(attr.name);
        if ((name === "href" || name === "src") && /^\s*javascript:/i.test(attr.value)) {
          el.removeAttribute(attr.name);
        }
      });
    });
    return doc.body.innerHTML;
  } catch {
    return raw;
  }
}

export default function EmailBody({
  html,
  text,
}: {
  html?: string | null;
  text?: string | null;
}) {
  const [view, setView] = useState<"html" | "text">("html");
  const [fit, setFit] = useState(true);
  const [height, setHeight] = useState(300);
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  const cleanHtml = useMemo(() => (html ? sanitizeEmailHtml(html) : ""), [html]);

  const measure = () => {
    const frame = frameRef.current;
    try {
      const body = frame?.contentDocument?.body;
      if (body) {
        const next = Math.max(140, Math.min(body.scrollHeight + 32, 4000));
        setHeight(next);
      }
    } catch {
      /* cross-origin document — keep the default height */
    }
  };

  useEffect(() => {
    if (view === "html") {
      const t = window.setTimeout(measure, 120);
      return () => window.clearTimeout(t);
    }
  }, [view, cleanHtml]);

  const openInNewTab = () => {
    if (!cleanHtml) return;
    const blob = new Blob([cleanHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  if (!html) {
    return text ? (
      <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">{text}</pre>
    ) : (
      <p className="text-sm text-muted-foreground">(no body)</p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
          <button
            onClick={() => setView("html")}
            className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all cursor-pointer ${
              view === "html" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Rendered
          </button>
          <button
            onClick={() => setView("text")}
            className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all cursor-pointer ${
              view === "text" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Plain text
          </button>
        </div>
        <div className="flex items-center gap-1">
          {view === "html" && (
            <button
              onClick={() => setFit((f) => !f)}
              title={fit ? "Show a fixed viewport" : "Fit to content"}
              className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              {fit ? "Fit" : "Scroll"}
            </button>
          )}
          <button
            onClick={openInNewTab}
            title="Open the rendered email in a new tab"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            <LinkSquare01Icon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {view === "html" ? (
        <div className="overflow-hidden rounded-lg border bg-white">
          <iframe
            ref={frameRef}
            title="Email content"
            srcDoc={cleanHtml}
            // allow-same-origin lets us measure the content height; scripts stay disabled.
            sandbox="allow-same-origin"
            onLoad={measure}
            style={{ height: fit ? height : 420, width: "100%", border: 0, display: "block" }}
            className="max-w-full"
          />
        </div>
      ) : (
        <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed">
          {text || "(no plain-text body)"}
        </pre>
      )}
    </div>
  );
}

export function RawHeaders({
  message,
}: {
  message: {
    from?: { email: string; name?: string | null } | null;
    to?: Array<{ email: string; name?: string | null }>;
    cc?: Array<{ email: string; name?: string | null }>;
    replyTo?: { email: string; name?: string | null } | null;
    messageId?: string | null;
    inReplyTo?: string | null;
    references?: string[] | null;
    providerMessageId?: string | null;
    headers?: Record<string, string> | null;
    sentAt?: string | null;
    receivedAt?: string | null;
  };
}) {
  const rows: Array<[string, string]> = [];
  const push = (k: string, v?: string | null) => {
    if (v) rows.push([k, v]);
  };
  const fmt = (a?: { email: string; name?: string | null } | null) =>
    a ? (a.name ? `${a.name} <${a.email}>` : a.email) : "";
  const fmtList = (l?: Array<{ email: string; name?: string | null }>) =>
    l && l.length ? l.map((x) => fmt(x)).join(", ") : "";

  push("From", fmt(message.from));
  push("To", fmtList(message.to));
  push("Cc", fmtList(message.cc));
  push("Reply-To", fmt(message.replyTo));
  push("Message-ID", message.messageId);
  push("In-Reply-To", message.inReplyTo);
  push("References", message.references && message.references.length ? message.references.join(" ") : null);
  push("Provider message id", message.providerMessageId);
  push("Sent at", message.sentAt);
  push("Received at", message.receivedAt);
  Object.entries(message.headers ?? {}).forEach(([k, v]) => push(k, v));

  return (
    <div className="space-y-1 rounded-lg border bg-muted/20 p-2.5">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[150px_1fr] gap-2 text-[11px]">
          <span className="font-medium text-foreground">{k}</span>
          <span className="break-all text-muted-foreground">{v}</span>
        </div>
      ))}
      {rows.length === 0 && <p className="text-[11px] text-muted-foreground">No headers recorded.</p>}
    </div>
  );
}
