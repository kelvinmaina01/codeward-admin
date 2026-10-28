import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";

export type MessageDirection = "inbound" | "outbound";
export type MessageCategory = "transactional" | "personal" | "marketing" | "unknown";
export type ThreadFilter = "all" | "transactional" | "personal";
export type DirectionFilter = "all" | "inbound" | "outbound";

/**
 * Delivery status of a message, as reported by the provider.
 * `bounced`, `failed` and `complained` are the failure states — a bounced
 * message never reached the recipient and can be retried from the UI.
 */
export type MessageStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "delivery_delayed"
  | "received"
  | "bounced"
  | "failed"
  | "complained"
  | "unknown"
  | null;

export const FAILURE_STATUSES: MessageStatus[] = ["bounced", "failed", "complained"];

export const STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  queued: { label: "Queued", className: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  delivered: { label: "Delivered", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  delivery_delayed: { label: "Delayed", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  received: { label: "Received", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  bounced: { label: "Bounced", className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  failed: { label: "Failed", className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  complained: { label: "Complained", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  suppressed: { label: "Suppressed", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  canceled: { label: "Canceled", className: "bg-muted text-muted-foreground" },
  unknown: { label: "Unknown", className: "bg-muted text-muted-foreground" },
};

export type EmailParticipant = {
  email: string;
  name?: string | null;
};

export type EmailMessage = {
  id: string;
  threadId: string;
  direction: MessageDirection;
  from: EmailParticipant | null;
  to: EmailParticipant[];
  cc: EmailParticipant[];
  bcc: EmailParticipant[];
  replyTo: EmailParticipant | null;
  subject: string | null;
  messageId: string | null;
  inReplyTo: string | null;
  references: string[] | null;
  headers: Record<string, string> | null;
  htmlBody: string | null;
  textBody: string | null;
  category: MessageCategory;
  provider: "resend" | "eusend" | "mock" | null;
  providerMessageId: string | null;
  status: MessageStatus;
  /** Provider explanation for a failed/bounced/complained delivery. */
  statusReason?: string | null;
  /** Recipient address the provider rejected. */
  failedRecipient?: string | null;
  /** True when the API considers the message safe to send again. */
  isResendable?: boolean;
  lastAttemptAt?: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  attachments?: Array<{ filename: string; contentType: string; size: number }>;
};

export type EmailThread = {
  id: string;
  subject: string | null;
  category: MessageCategory;
  snippet: string | null;
  lastMessageAt: string | null;
  lastMessageFrom: EmailParticipant | null;
  lastMessageDirection: MessageDirection | null;
  participants: EmailParticipant[];
  hasReplyFromAdmin: boolean;
  inboundCount: number;
  outboundCount: number;
  messageCount: number;
  isUnread: boolean;
  /** Delivery status of the newest message in the thread. */
  lastMessageStatus?: MessageStatus;
  deliveredCount?: number;
  bouncedCount?: number;
  failedCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type ThreadListResponse = {
  threads: EmailThread[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ThreadDetailResponse = {
  thread: EmailThread;
  messages: EmailMessage[];
};

export function useMessageThreads(params: {
  filter?: ThreadFilter;
  direction?: DirectionFilter;
  /** `failed` returns threads containing a bounced, failed or complained message. */
  status?: "failed" | "delivered";
  q?: string;
  page?: number;
  limit?: number;
} = {}) {
  const search = new URLSearchParams();
  if (params.filter && params.filter !== "all") search.set("filter", params.filter);
  if (params.direction && params.direction !== "all") search.set("direction", params.direction);
  if (params.status) search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  const qs = search.toString() ? `?${search.toString()}` : "";

  return useQuery({
    queryKey: ["messages-threads", params],
    queryFn: () => apiFetch<ThreadListResponse>(`/messages/threads${qs}`),
    placeholderData: (prev) => prev,
  });
}

export function useMessageThread(threadId: string | undefined) {
  return useQuery({
    queryKey: ["messages-thread", threadId],
    queryFn: () => apiFetch<ThreadDetailResponse>(`/messages/threads/${threadId}`),
    enabled: !!threadId,
  });
}

export function useReplyToThread(threadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { to: string[]; cc?: string[]; subject?: string; text?: string; html?: string }) =>
      apiFetch<{ success: boolean; message: EmailMessage }>(`/messages/threads/${threadId}/reply`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages-thread", threadId] });
      qc.invalidateQueries({ queryKey: ["messages-threads"] });
    },
  });
}

/**
 * Send a message again after it bounced or failed.
 * The API keeps the original record and links the new attempt to it.
 */
export function useResendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { messageId: string; to?: string[]; reason?: string }) =>
      apiFetch<{ success: boolean; message: EmailMessage }>(`/messages/${input.messageId}/resend`, {
        method: "POST",
        body: JSON.stringify({ to: input.to, reason: input.reason }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages-thread"] });
      qc.invalidateQueries({ queryKey: ["messages-threads"] });
    },
  });
}

/**
 * Pull the latest mail from the provider (Resend history + inbound replies).
 * Hits the global sync endpoint, which is provider-wide.
 */
export function useSyncMessages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ success: boolean; synced: number; skipped: number; total: number; errors: string[] }>(
        "/messages/sync",
        { method: "POST" }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages-thread"] });
      qc.invalidateQueries({ queryKey: ["messages-threads"] });
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Sender presets for @codeward.cloud                                 */
/* ------------------------------------------------------------------ */

export type SenderPreset = {
  label: string;
  email: string;
  color: string;
};

export const SENDER_PRESETS: SenderPreset[] = [
  {
    label: "Kelvin",
    email: "kelvin@codeward.cloud",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    label: "Melisa",
    email: "melisa@codeward.cloud",
    color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  },
  {
    label: "Support",
    email: "support@codeward.cloud",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Hello",
    email: "hello@codeward.cloud",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    label: "Team",
    email: "team@codeward.cloud",
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
];

/* ------------------------------------------------------------------ */
/*  Compose & send a brand-new email (not a reply)                     */
/* ------------------------------------------------------------------ */

export function useSendEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      from: string;
      fromName?: string;
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      text?: string;
      html?: string;
    }) =>
      apiFetch<{ success: boolean; message: EmailMessage }>("/messages/send", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages-threads"] });
    },
  });
}

export function isFailureStatus(status: MessageStatus) {
  return status === "bounced" || status === "failed" || status === "complained";
}
