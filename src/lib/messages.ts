import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";

export type MessageDirection = "inbound" | "outbound";
export type MessageCategory = "transactional" | "personal" | "marketing" | "unknown";
export type ThreadFilter = "all" | "transactional" | "personal";

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
  status: string | null;
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
  q?: string;
  page?: number;
  limit?: number;
} = {}) {
  const search = new URLSearchParams();
  if (params.filter && params.filter !== "all") search.set("filter", params.filter);
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
