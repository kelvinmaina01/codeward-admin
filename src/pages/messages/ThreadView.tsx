import { useState } from "react";
import { ArrowLeft, Loader2, Mail, Reply, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { useMessageThread, useReplyToThread, type EmailMessage } from "../../lib/messages";
import { cn } from "../../lib/utils";

function formatFull(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString();
}

function addr(a: { email: string; name?: string | null } | null) {
  if (!a) return "";
  if (a.name) return `${a.name} <${a.email}>`;
  return a.email;
}

function addrs(list: Array<{ email: string; name?: string | null }>) {
  if (!list || list.length === 0) return "";
  return list.map(addr).join(", ");
}

export default function ThreadView({ threadId }: { threadId: string }) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useMessageThread(threadId);
  const reply = useReplyToThread(threadId);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [text, setText] = useState("");
  const [html, setHtml] = useState("");

  const messages = data?.messages ?? [];
  const thread = data?.thread;

  const toggle = (id: string) => {
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const openReply = (m: EmailMessage) => {
    const firstTo = m.direction === "inbound" ? addr(m.from) : addrs(m.to);
    setTo(firstTo);
    setCc("");
    setText("");
    setHtml("");
    setShowComposer(true);
    setExpanded((prev) => (prev.includes(m.id) ? prev : [...prev, m.id]));
  };

  const send = () => {
    if (!to.trim()) return;
    const toList = to
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const ccList = cc
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    reply.mutate(
      { to: toList, cc: ccList.length ? ccList : undefined, text: text || undefined, html: html || undefined },
      { onSuccess: () => setShowComposer(false) }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (isError || !thread) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-destructive">Failed to load thread.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/messages")}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Messages
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/messages")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-base font-semibold">{thread.subject || "(no subject)"}</h2>
            <p className="text-xs text-muted-foreground">
              {thread.messageCount} message{thread.messageCount === 1 ? "" : "s"} · {thread.category}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => openReply(messages[messages.length - 1])}>
          <Reply className="mr-1.5 h-3.5 w-3.5" /> Reply
        </Button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          {messages.map((m) => {
            const open = expanded.includes(m.id);
            const fromStr = addr(m.from);
            const toStr = addrs(m.to);
            const ccStr = addrs(m.cc);
            return (
              <div key={m.id} className="rounded-xl border bg-card shadow-sm">
                <button
                  onClick={() => toggle(m.id)}
                  className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{m.from?.name || m.from?.email || "Unknown"}</span>
                      <span
                        className={cn(
                          "rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                          m.direction === "outbound"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        {m.direction}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">to: {toStr || "—"}</p>
                    {!open && m.textBody && (
                      <p className="mt-1 truncate text-[12px] text-muted-foreground">{m.textBody}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{formatFull(m.sentAt || m.receivedAt)}</span>
                </button>
                {open && (
                  <div className="border-t px-4 py-3">
                    <div className="mb-3 grid gap-1 text-[11px] text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">From:</span> {fromStr || "—"}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">To:</span> {toStr || "—"}
                      </p>
                      {ccStr && (
                        <p>
                          <span className="font-medium text-foreground">Cc:</span> {ccStr}
                        </p>
                      )}
                      {m.replyTo && (
                        <p>
                          <span className="font-medium text-foreground">Reply-To:</span> {addr(m.replyTo)}
                        </p>
                      )}
                      {m.messageId && (
                        <p className="truncate">
                          <span className="font-medium text-foreground">Message-ID:</span> {m.messageId}
                        </p>
                      )}
                    </div>
                    {m.htmlBody ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: m.htmlBody }} />
                    ) : m.textBody ? (
                      <pre className="whitespace-pre-wrap break-words text-sm">{m.textBody}</pre>
                    ) : (
                      <p className="text-sm text-muted-foreground">(no body)</p>
                    )}
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => openReply(m)}>
                        <Reply className="mr-1.5 h-3.5 w-3.5" /> Reply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {showComposer && (
            <div className="rounded-xl border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b px-4 py-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Reply</span>
              </div>
              <div className="grid gap-2 px-4 py-3">
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="To"
                  className="h-8 rounded-lg border bg-background px-2 text-[12px] outline-none"
                />
                <input
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="Cc (optional)"
                  className="h-8 rounded-lg border bg-background px-2 text-[12px] outline-none"
                />
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write your reply (plain text)..."
                  rows={8}
                  className="rounded-lg border bg-background px-2 py-1.5 text-sm outline-none"
                />
                <textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  placeholder="HTML body (optional) — leave blank to send plain text"
                  rows={4}
                  className="rounded-lg border bg-background px-2 py-1.5 font-mono text-xs outline-none"
                />
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">Replies use In-Reply-To/References from the thread.</p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setShowComposer(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" disabled={reply.isPending || !to.trim()} onClick={send}>
                      {reply.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
