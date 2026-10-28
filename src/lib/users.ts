import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./api";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role?: string;
  plan?: string;
  createdAt?: string;
  orgName?: string;
  repoCount?: number;
};

export type PaginatedUsers = {
  users: AppUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/**
 * Searches users across the application database
 */
export function useUserDirectory(searchQuery = "", limit = 50) {
  const q = searchQuery.trim();
  const searchParam = q ? `&search=${encodeURIComponent(q)}` : "";

  return useQuery({
    queryKey: ["app-users-directory", q, limit],
    queryFn: () =>
      apiFetch<PaginatedUsers>(`/users?page=1&limit=${limit}${searchParam}`),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

/**
 * Smart email extractor from arbitrary strings, comma/space lists,
 * URLs with email params, mailto links, or mixed markdown/HTML text.
 */
export function extractEmailsFromInput(raw: string): string[] {
  if (!raw || !raw.trim()) return [];

  // 1. If it's a URL or mailto link: decode URI components first
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // ignore decoding errors
  }

  // 2. Comprehensive email extraction regex (RFC 5322 compliant subset)
  const emailRegex = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+/g;
  const matches = decoded.match(emailRegex) || [];

  // Deduplicate and convert to lowercase
  const unique = Array.from(
    new Set(matches.map((e) => e.trim().toLowerCase())),
  ).filter((e) => e.length > 3 && e.includes("."));

  return unique;
}
