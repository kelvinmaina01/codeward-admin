import { useState } from "react";
import { ArrowLeft, Loader2, Mail, Reply, RefreshCw, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import EmailBody, { RawHeaders } from "../../components/messages/EmailBody";
import ResendMessageDialog from "./ResendMessageDialog";
import {
  STATUS_META,
  isFailureStatus,
  useMessageThread,
  useReplyToThread,
  useSyncThread,
  type DirectionFilter,
  type EmailMessage,
  type MessageStatus,
} from "../../lib/messages";
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

function addrs(list: Array<{ email: string; name?: string | null }> | undefined) {
  if (!list || list.length === 0) return "";
  return list.map(addr).join(", ");
}

function StatusBadge({ status }: { status: MessageStatus }) {
  const key = status ?? "unknown";
  const meta = STATUS_META[key] ?? STATUS_META.unknown;
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", meta.className)}>
      {meta.label}
    </span>
  );
}

const DIRECTION_FILTERS: Array<{ value: DirectionFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "inbound", label: "Incoming" },
  { value: "outbound", label: "Outgoing" },
];

export default function ThreadView({ threadId }: { threadId: string }) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useMessageThread(threadId);
  const reply = useReplyToThread(threadId);
  const sync = useSyncThread();
  const [direction, setDirection] = useState<DirectionFilter>("all");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [showHeaders, setShowHeaders] = useState<string[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [resendTarget, setResendTarget] = useState<EmailMessage | null>(null);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [text, setText] = useState("");
  const [html, setHtml] = useState("");

  const messages = data?.messages ?? [];
  const thread = data?.thread;

  const toggle = (id: string) => {
    setCollapsed((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const openReply = (m: EmailMessage) => {
    const firstTo = m.direction === "inbound" ? addr(m.from) : addrs(m.to);
    setTo(firstTo);
    setCc("");
    setText("");
    setHtml("");
    setShowComposer(true);
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

  const visible = messages.filter((m) => direction === "all" || m.direction === direction);
  const counts = {
    inbound: messages.filter((m) => m.direction === "inbound").length,
    outbound: messages.filter((m) => m.direction === "outbound").length,
  };
  const failures = messages.filter((m) => isFailureStatus(m.status)).length;

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/messages")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-base font-semibold">{thread.subject || "(no subject)"}</h2>
            <p className="text-xs text-muted-foreground">
              {thread.messageCount} message{thread.messageCount === 1 ? "" : "s"} · {thread.category}
              {failures > 0 && (
                <span className="ml-1.5 font-medium text-rose-500">
                  · {failures} failed
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
            {DIRECTION_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setDirection(f.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer",
                  direction === f.value
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
                {f.value === "inbound" && counts.inbound > 0 && (
                  <span className="ml-1 text-[10px] text-muted-foreground">{counts.inbound}</span>
                )}
                {f.value === "outbound" && counts.outbound > 0 && (
                  <span className="ml-1 text-[10px] text-muted-foreground">{counts.outbound}</span>
                )}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={sync.isPending}
            title="Pull the latest delivery status and inbound replies from the provider"
            onClick={() => sync.mutate(threadId)}
          >
            {sync.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Sync
          </Button>
          <Button size="sm" onClick={() => openReply(messages[messages.length - 1])}>
            <Reply className="mr-1.5 h-3.5 w-3.5" /> Reply
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          {visible.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No {direction === "inbound" ? "incoming" : "outgoing"} messages in this thread.
            </p>
          )}

          {visible.map((m) => {
            const open = !collapsed.includes(m.id);
            const fromStr = addr(m.from);
            const toStr = addrs(m.to);
            const ccStr = addrs(m.cc);
            const isOut = m.direction === "outbound";
            const failed = isFailureStatus(m.status);
            return (
              <div
                key={m.id}
                className={cn(
                  "rounded-xl border bg-card shadow-sm",
                  isOut ? "border-blue-500/25" : "border-emerald-500/25"
                )}
              >
                <button
                  onClick={() => toggle(m.id)}
                  className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">
                        {m.from?.name || m.from?.email || (isOut ? "Us" : "Unknown")}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                          isOut
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        {isOut ? "Outgoing" : "Incoming"}
                      </span>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {isOut ? "to" : "from"}: {isOut ? toStr || "—" : fromStr || "—"}
                    </p>
                    {!open && m.textBody && (
                      <p className="mt-1 truncate text-[12px] text-muted-foreground">{m.textBody}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {formatFull(m.sentAt || m.receivedAt)}
                  </span>
                </button>

                {open && (
                  <div className="border-t px-4 py-3">
                    {failed && (
                      <div className="mb-3 rounded-lg border border-rose-500/25 bg-rose-500/5 p-2.5 text-[11px]">
                        <p className="font-semibold text-rose-600 dark:text-rose-400">
                          Delivery failed{m.failedRecipient ? ` — ${m.failedRecipient}` : ""}
                        </p>
                        {m.statusReason && (
                          <p className="mt-0.5 break-words text-muted-foreground">{m.statusReason}</p>
                        )}
                        {m.lastAttemptAt && (
                          <p className="mt-0.5 text-muted-foreground">
                            Last attempt: {formatFull(m.lastAttemptAt)}
                          </p>
                        )}
                      </div>
                    )}

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
                    </div>

                    <EmailBody html={m.htmlBody} text={m.textBody} />

                    {showHeaders.includes(m.id) && (
                      <div className="mt-3">
                        <RawHeaders message={m} />
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setShowHeaders((prev) =>
                            prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id]
                          )
                        }
                      >
                        {showHeaders.includes(m.id) ? "Hide headers" : "Show headers"}
                      </Button>
                      {failed && (
                        <Button size="sm" variant="outline" onClick={() => setResendTarget(m)}>
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Resend
                        </Button>
                      )}
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
                {reply.isError && (
                  <p className="text-[11px] text-destructive">
                    {reply.error.message.replace(/^API Error \d+:\s*/, "")}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">Replies use In-Reply-To/References from the thread.</p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setShowComposer(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" disabled={reply.isPending || !to.trim()} onClick={send}>
                      {reply.isPending ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {resendTarget && (
        <ResendMessageDialog
          message={resendTarget}
          onClose={() => setResendTarget(null)}
          onDone={() => setResendTarget(null)}
        />
      )}
    </div>
  );
}
